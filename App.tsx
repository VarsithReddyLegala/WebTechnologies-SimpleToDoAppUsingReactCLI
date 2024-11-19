import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  const [task, setTask] = useState<string>(''); // Task input state
  const [tasks, setTasks] = useState<Task[]>([]); // Tasks list state
  const [isEditing, setIsEditing] = useState<boolean>(false); // Tracks if editing mode is active
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // Tracks the task being edited
  const scaleAnimation = useRef(new Animated.Value(0)).current; // Animation for adding tasks
  const fadeAnimation = useRef<Record<string, Animated.Value>>({}); // Fade animation for each task

  // Load tasks from AsyncStorage on app launch
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (error) {
        console.error('Failed to load tasks', error);
      }
    };
    loadTasks();
  }, []);

  // Save tasks to AsyncStorage whenever the tasks state changes
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
      } catch (error) {
        console.error('Failed to save tasks', error);
      }
    };
    saveTasks();
  }, [tasks]);

  const addTask = () => {
    if (task.trim()) {
      const newTask: Task = { id: Date.now().toString(), text: task, completed: false };
      fadeAnimation.current[newTask.id] = new Animated.Value(1); // Initialize fade value for the new task
      setTasks((prevTasks) => [...prevTasks, newTask]);
      setTask('');
      triggerAddAnimation(); // Trigger animation for adding task
    }
  };

  const triggerAddAnimation = () => {
    scaleAnimation.setValue(0); // Reset scale value
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const deleteTask = (taskId: string) => {
    const fadeValue = fadeAnimation.current[taskId];
    if (!fadeValue) {
      // Ensure fadeAnimation exists for the task
      console.warn(`Fade animation not initialized for task: ${taskId}`);
      setTasks((prevTasks) => prevTasks.filter((item) => item.id !== taskId));
      return;
    }

    // Trigger fade-out animation
    Animated.timing(fadeValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Remove task after animation completes
      setTasks((prevTasks) => prevTasks.filter((item) => item.id !== taskId));
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((item) =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const startEditing = (taskId: string, currentText: string) => {
    setIsEditing(true);
    setEditingTaskId(taskId);
    setTask(currentText);
  };

  const saveEditedTask = () => {
    if (editingTaskId) {
      setTasks((prevTasks) =>
        prevTasks.map((item) =>
          item.id === editingTaskId ? { ...item, text: task } : item
        )
      );
      setTask('');
      setIsEditing(false);
      setEditingTaskId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add or edit a task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={isEditing ? saveEditedTask : addTask}
        >
          <Text style={styles.addButtonText}>{isEditing ? '✓' : '+'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <Animated.View
            style={[
              styles.taskContainer,
              {
                opacity: fadeAnimation.current[item.id], // Apply fade animation
                transform: [{ scale: scaleAnimation }], // Apply scale animation
              },
            ]}
          >
            <TouchableOpacity
              style={styles.taskTextContainer}
              onPress={() => toggleTaskCompletion(item.id)}
            >
              <Text style={[styles.taskText, item.completed && styles.completedTask]}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEditing(item.id, item.text)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButtonContainer}
                onPress={() => deleteTask(item.id)}
              >
                <Text style={styles.deleteButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 10,
  },
  editButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  deleteButtonContainer: {},
  deleteButtonText: {
    color: '#FF5C5C',
    fontWeight: 'bold',
  },
});
