// App.tsx

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";

type Role = "user" | "assistant";

interface ChatTurn {
  role: Role;
  text: string;
  timestamp: number;
}

interface JarvisResponse {
  reply: string;
  actions?: string[];
}

export default function App() {
  const [lastUserText, setLastUserText] = useState("");
  const [lastJarvisText, setLastJarvisText] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [inputText, setInputText] = useState("");
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActions, setLastActions] = useState<string[]>([]);

  const addToHistory = (role: Role, text: string) => {
    setHistory((prev) => [...prev, { role, text, timestamp: Date.now() }]);
  };

  const handleSendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    let messageText = trimmed;
    setLastActions([]);

    if (wakeWordEnabled) {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("hey jarvis")) {
        messageText = trimmed.slice("hey jarvis".length).trim();
      } else {
        setLastUserText(trimmed);
        addToHistory("user", trimmed);

        const reminder =
          'I heard you, but wake word is on. Start with “Hey Jarvis…”';
        setLastJarvisText(reminder);
        addToHistory("assistant", reminder);
        Speech.speak(reminder);
        setInputText("");
        return;
      }
    }

    setLastUserText(messageText);
    addToHistory("user", messageText);
    setInputText("");
    setIsProcessing(true);

    try {
      const res = await callJarvisLocally(history, messageText);

      setLastJarvisText(res.reply);
      addToHistory("assistant", res.reply);
      setLastActions(res.actions ?? []);

      Speech.speak(res.reply);
    } catch (error) {
      console.error("Jarvis error:", error);
      const fallback = "Something went wrong in my thinking loop.";
      setLastJarvisText(fallback);
      addToHistory("assistant", fallback);
      Speech.speak(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = () => {
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
  };

  const handleMicPress = () => {
    const msg =
      "Microphone control will work in a development build. For now, type to talk to me.";
    setLastJarvisText(msg);
    addToHistory("assistant", msg);
    Speech.speak(msg);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="infinite" size={75} color="#B51D1D" />
        </View>

        <Text style={styles.userText}>{lastUserText || ""}</Text>

        <Text style={styles.jarvisText}>
          {lastJarvisText || 'Just say or type: "Hey Jarvis…"'}
        </Text>

        {lastActions.length > 0 && (
          <View style={styles.actionsContainer}>
            {lastActions.map((a, idx) => (
              <Text key={idx} style={styles.actionsText}>
                {a}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.bottomPanel}>
          <View style={styles.wakeRow}>
            <Text style={styles.wakeLabel}>Wake word: "Hey Jarvis"</Text>
            <Switch
              value={wakeWordEnabled}
              onValueChange={setWakeWordEnabled}
            />
          </View>

          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            activeOpacity={0.8}
          >
            <Ionicons name="mic-outline" size={34} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder='Type here: "Hey Jarvis, …"'
              placeholderTextColor="#777"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleTextSubmit}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isProcessing ? "hourglass-outline" : "send"}
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Local fake Jarvis brain – better responses now,
 * while still working fully offline in Expo Go.
 */
async function callJarvisLocally(
  history: ChatTurn[],
  newUserMessage: string
): Promise<JarvisResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const lower = newUserMessage.toLowerCase();
  const actions: string[] = [];
  let reply = "";

  if (lower.includes("how are you")) {
    reply =
      "I don’t have feelings, but all systems are stable, and my code feels clean.";
  } else if (lower.includes("who are you")) {
    reply =
      "I'm your Jarvis prototype. Running locally for now, but soon I'll connect to real AI and your smart home.";
  } else if (lower.includes("what can you do")) {
    reply =
      "Right now, I can chat and simulate controlling your lights. Soon, I’ll remember things, help you study, and control your actual house.";
  } else if (lower.includes("study")) {
    reply =
      "I’ll eventually help you revise paramedic topics, track weak areas, and even test you with flashcards.";
  } else if (lower.includes("diablo")) {
    reply =
      "I don’t know your current Diablo build yet, but I like the idea of tracking your level, stats, and skill tree.";
  }

  if (lower.includes("living room") && lower.includes("light")) {
    if (lower.includes("turn on") || lower.includes("switch on")) {
      actions.push("Simulated: Tapo living room lights ON");
      reply =
        reply ||
        "Turning on the living room lights. Simulated for now — real control coming soon.";
    } else if (lower.includes("turn off") || lower.includes("switch off")) {
      actions.push("Simulated: Tapo living room lights OFF");
      reply =
        reply ||
        "Switching off the living room lights. Still just pretending, but we're getting closer.";
    }
  }

  if (!reply) {
    reply = `"${newUserMessage}" — I hear you, but I’m still in local simulation mode. Soon I’ll be connected to a real AI backend.`;
  }

  return { reply, actions };
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5C7A5A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 50,
  },
  userText: {
    fontSize: 18,
    color: "#F4F4F4",
    marginBottom: 30,
    fontStyle: "italic",
  },
  jarvisText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 40,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsText: {
    fontSize: 14,
    color: "#DBDBDB",
    marginTop: 2,
  },
  bottomPanel: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  wakeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  wakeLabel: {
    color: "#E3E3E3",
    fontSize: 14,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#B51D1D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#ffffff22",
    color: "#FFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#B51D1D",
    alignItems: "center",
    justifyContent: "center",
  },
});
