export async function sendTelegramAlert(
  botToken: string | undefined,
  chatId: string | undefined,
  message: string
): Promise<void> {
  if (!botToken || !chatId) return;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
}
