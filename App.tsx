import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

type Filter = 'all' | 'active' | 'completed';

const STORAGE_KEY = 'minimal_todo_tasks_v1';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const rawTasks = await AsyncStorage.getItem(STORAGE_KEY);
        if (rawTasks) {
          const parsed = JSON.parse(rawTasks) as Task[];
          setTasks(parsed);
        }
      } catch (error) {
        console.warn('Unable to load saved tasks', error);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadTasks();
  }, []);

  useEffect(() => {
    const saveTasks = async () => {
      if (!isLoaded) {
        return;
      }

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (error) {
        console.warn('Unable to save tasks', error);
      }
    };

    void saveTasks();
  }, [tasks, isLoaded]);

  const visibleTasks = useMemo(() => {
    if (filter === 'active') {
      return tasks.filter((task) => !task.done);
    }

    if (filter === 'completed') {
      return tasks.filter((task) => task.done);
    }

    return tasks;
  }, [tasks, filter]);

  const activeCount = tasks.filter((task) => !task.done).length;
  const completedCount = tasks.length - activeCount;

  const addTask = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const nextTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      done: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [nextTask, ...prev]);
    setInput('');
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    Alert.alert('Delete task', 'This task will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTasks((prev) => prev.filter((task) => task.id !== taskId));
        },
      },
    ]);
  };

  const clearCompleted = () => {
    if (completedCount === 0) {
      return;
    }

    setTasks((prev) => prev.filter((task) => !task.done));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Family To-Do</Text>
          <Text style={styles.subtitle}>
            {activeCount} active | {completedCount} completed
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Add a task"
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            onSubmitEditing={addTask}
          />
          <Pressable style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'active', 'completed'] as Filter[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                filter === item ? styles.filterChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item ? styles.filterChipTextActive : null,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={clearCompleted} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear completed</Text>
          </Pressable>
        </View>

        <FlatList
          data={visibleTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            visibleTasks.length === 0 ? styles.emptyListContainer : styles.list
          }
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <Pressable
                onPress={() => toggleTask(item.id)}
                style={styles.taskMain}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.done ? styles.checkboxDone : undefined,
                  ]}
                >
                  {item.done ? <Text style={styles.checkboxMark}>OK</Text> : null}
                </View>
                <Text
                  style={[
                    styles.taskTitle,
                    item.done ? styles.taskTitleDone : undefined,
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => deleteTask(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyText}>Add one to get started.</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  addButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  filterRow: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#eceff3',
  },
  filterChipActive: {
    backgroundColor: '#111827',
  },
  filterChipText: {
    textTransform: 'capitalize',
    color: '#4b5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#f9fafb',
  },
  clearButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  clearButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  list: {
    paddingTop: 6,
    paddingBottom: 28,
    gap: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxDone: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkboxMark: {
    color: '#f9fafb',
    fontSize: 9,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 16,
    color: '#111827',
    flexShrink: 1,
    lineHeight: 22,
  },
  taskTitleDone: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    color: '#6b7280',
  },
});
