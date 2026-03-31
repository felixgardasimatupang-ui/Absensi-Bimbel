import { config } from "./config.js";

export const buildAttendanceWhatsappMessage = ({
  studentName,
  parentName,
  className,
  status,
  topic,
  schedule,
  evaluationSummary
}) => `Halo ${parentName},

Informasi kehadiran dari ${config.whatsappSender}:
- Siswa: ${studentName}
- Kelas: ${className}
- Topik: ${topic}
- Jadwal: ${schedule}
- Status Kehadiran: ${status}

${evaluationSummary ? `Evaluasi singkat: ${evaluationSummary}` : "Evaluasi belum diinput."}

Terima kasih.`;

export const sendWhatsappMessage = async ({ phone, message }) => {
  if (!config.whatsappApiUrl) {
    return {
      ok: false,
      provider: "DISABLED",
      error: "WHATSAPP_API_URL belum diatur."
    };
  }

  const response = await fetch(config.whatsappApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.whatsappApiToken
        ? `Bearer ${config.whatsappApiToken}`
        : undefined
    },
    body: JSON.stringify({
      to: phone,
      message
    })
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    provider: "CUSTOM_WHATSAPP",
    providerRef: data.id || data.messageId || null,
    error: response.ok ? null : data.message || "Gagal mengirim notifikasi."
  };
};
