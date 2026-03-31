import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";

export default function App() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    studentId: "",
    code: ""
  });
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [sessions, setSessions] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        "x-client-platform": "mobile",
        ...(options.headers || {})
      },
      ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Permintaan gagal.");
    }
    return data;
  };

  const login = async () => {
    try {
      setSubmitting(true);
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      setUser(data.user);
      setAuthToken(data.token || "");
      setMessage("Login aplikasi seluler berhasil.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await request("/sessions");
      setSessions(data.sessions);
    } catch (_error) {
      setSessions([]);
      setMessage("Gagal memuat sesi dari server.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const scanAttendance = async () => {
    try {
      setSubmitting(true);
      const data = await request("/qr/scan", {
        method: "POST",
        body: JSON.stringify({
          studentId: form.studentId,
          code: form.code
        })
      });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.badge}>Absensi Bimbel Mobile</Text>
        <Text style={styles.title}>Aplikasi seluler untuk absensi dan check-in QR.</Text>
        <Text style={styles.subtitle}>
          Aplikasi seluler ini memakai token otorisasi khusus, jadi tidak lagi bergantung pada cookie browser.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={(value) => update("email", value)} placeholder="Email admin atau staf" autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} value={form.password} onChangeText={(value) => update("password", value)} placeholder="Kata sandi" secureTextEntry />
          <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={login} disabled={submitting}>
            <Text style={styles.primaryButtonText}>{submitting ? "Memproses..." : "Masuk"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pindai QR Manual</Text>
          <TextInput style={styles.input} value={form.studentId} onChangeText={(value) => update("studentId", value)} placeholder="ID siswa" />
          <TextInput style={[styles.input, styles.largeInput]} value={form.code} onChangeText={(value) => update("code", value)} placeholder="Tempel hasil pindai QR" multiline />
          <TouchableOpacity style={[styles.secondaryButton, (!authToken || submitting) && styles.buttonDisabled]} onPress={scanAttendance} disabled={!authToken || submitting}>
            <Text style={styles.secondaryButtonText}>Kirim Absensi QR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sesi tersedia</Text>
          {!user ? <Text style={styles.helperText}>Login dulu untuk mengambil sesi dari server.</Text> : null}
          {loadingSessions ? <ActivityIndicator color="#145374" /> : null}
          {sessions.map((item) => (
            <View key={item.id} style={styles.sessionRow}>
              <Text style={styles.sessionTitle}>{item.classRoom.name}</Text>
              <Text style={styles.sessionMeta}>{item.topic}</Text>
            </View>
          ))}
          {user && !loadingSessions && sessions.length === 0 ? <Text style={styles.helperText}>Belum ada sesi yang bisa ditampilkan.</Text> : null}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Text style={styles.footnote}>API: {API_URL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7f8"
  },
  container: {
    padding: 20,
    gap: 16
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#d9ebf2",
    color: "#145374",
    fontWeight: "700"
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#11212d"
  },
  subtitle: {
    color: "#5f7280",
    marginBottom: 8
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    gap: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11212d"
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7e0e5",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fcfeff"
  },
  largeInput: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  primaryButton: {
    backgroundColor: "#145374",
    borderRadius: 14,
    padding: 14
  },
  primaryButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: "#e9f0f4",
    borderRadius: 14,
    padding: 14
  },
  secondaryButtonText: {
    color: "#145374",
    textAlign: "center",
    fontWeight: "700"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  sessionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f5"
  },
  sessionTitle: {
    fontWeight: "700",
    color: "#11212d"
  },
  sessionMeta: {
    color: "#5f7280",
    marginTop: 4
  },
  message: {
    color: "#145374",
    fontWeight: "700"
  },
  helperText: {
    color: "#5f7280"
  },
  footnote: {
    color: "#7f8d96",
    fontSize: 12
  }
});
