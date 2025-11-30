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

  // Add a line to the in-memory conversation
  const addToHistory = (role: Role, text: string) => {
    setHistory((prev) => [...prev, { role, text, timestamp: Date.now() }]);
  };

  // Main function when you send something to Jarvis
  const handleSendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    let messageText = trimmed;
    setLastActions([]);

    // Wake word: "Hey Jarvis"
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
        // Clear input since we handled it
        setInputText("");
        return;
      }
    }

    setLastUserText(messageText);
    addToHistory("user", messageText);
    setInputText(""); // <<< clear the input immediately
    setIsProcessing(true);

    try {
      // Local fake brain for now – no backend needed
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

  // For now, mic is just a placeholder in Expo Go
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
        {/* Red infinity icon (Jarvis) */}
        <View style={styles.iconContainer}>
          <Ionicons name="infinite" size={75} color="#B51D1D" />
        </View>

        {/* Your last spoken/typed text */}
        <Text style={styles.userText}>{lastUserText || ""}</Text>

        {/* Jarvis last reply */}
        <Text style={styles.jarvisText}>
          {lastJarvisText || 'Just say or type: "Hey Jarvis…"'}
        </Text>

        {/* Any smart-home actions (simulated right now) */}
        {lastActions.length > 0 && (
          <View style={styles.actionsContainer}>
            {lastActions.map((a, idx) => (
              <Text key={idx} style={styles.actionsText}>
                {a}
              </Text>
            ))}
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.bottomPanel}>
          {/* Wake word switch */}
          <View style={styles.wakeRow}>
            <Text style={styles.wakeLabel}>Wake word: "Hey Jarvis"</Text>
            <Switch
              value={wakeWordEnabled}
              onValueChange={setWakeWordEnabled}
            />
          </View>

          {/* Mic button (placeholder for now) */}
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            activeOpacity={0.8}
          >
            <Ionicons name="mic-outline" size={34} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Text input */}
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
 * Local fake Jarvis brain – works fully in Expo Go.
 * Later we'll replace this with a real backend + OpenAI + Tapo.
 */
async function callJarvisLocally(
  history: ChatTurn[],
  newUserMessage: string
): Promise<JarvisResponse> {
  // Tiny delay to feel like "thinking"
  await new Promise((resolve) => setTimeout(resolve, 400));

  const lower = newUserMessage.toLowerCase();
  const actions: string[] = [];
  let reply = `You said: "${newUserMessage}". This is a local Jarvis test reply.`;

  // Simple fake "smart home" logic to show actions working
  if (lower.includes("living room") && lower.includes("light")) {
    if (lower.includes("turn on") || lower.includes("switch on")) {
      actions.push("Simulated: Tapo living room lights ON");
      reply = "Okay, turning on the living room lights (simulated).";
    }
    if (lower.includes("turn off") || lower.includes("switch off")) {
      actions.push("Simulated: Tapo living room lights OFF");
      reply = "Okay, turning off the living room lights (simulated).";
    }
  }

  return { reply, actions };
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // Slightly greener matte olive
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
    color: "#DADADA",
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
    backgroundColor: "#ffffff20",
    color: "#FFF",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
