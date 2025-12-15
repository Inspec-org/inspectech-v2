import Invitation from "@/lib/models/Invitation";

let started = false;
let timeout: NodeJS.Timeout | null = null;

function msUntilNextMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

async function updateExpiredInvitations() {
  const now = new Date();
  await Invitation.updateMany(
    { status: "pending", expiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  );
}

export function startInvitationCron() {
  if (started) return;
  started = true;

  const scheduleNext = () => {
    const delay = msUntilNextMidnight();
    timeout = setTimeout(async () => {
      await updateExpiredInvitations();
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}