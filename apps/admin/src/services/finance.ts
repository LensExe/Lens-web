import { adminApi } from "@/services/backend";
import { allPages, number, record, text } from "@/services/normalize";
import type { AdminWithdrawal, FinanceSummary, WithdrawalStatus } from "@/types";

export async function getWithdrawals(): Promise<AdminWithdrawal[]> {
  const [requests, users] = await Promise.all([
    allPages((query) => adminApi.listRefundRequests(query)),
    allPages((query) => adminApi.listUsers(query)),
  ]);
  const userById = new Map(users.map((raw) => {
    const row = record(raw);
    return [text(row.id), row] as const;
  }));
  return requests.flatMap((raw) => {
    const row = record(raw);
    if (row.request_type !== "wallet_withdrawal") return [];
    const destination = record(row.payout_destination);
    const payoutProviderStatus = text(row.payout_provider_status).toUpperCase() || undefined;
    const isPayoutProcessing = ["RECEIVED", "PROCESSING", "SUBMITTED", "APPROVED", "SCHEDULED", "ON_HOLD", "PARTIAL_COMPLETED", "COMPLETED"].includes(payoutProviderStatus ?? "");
    const status: WithdrawalStatus = row.status === "requested" ? "pending"
      : row.status === "completed" ? "completed"
      : row.status === "rejected" ? "rejected"
      : isPayoutProcessing ? "processing" : "approved";
    const user = userById.get(text(row.user_id));
    return [{
      id: text(row.id),
      photographerId: text(row.user_id),
      photographerName: text(user?.fullname, "Nhiếp ảnh gia"),
      avatar: text(user?.avatar_url),
      amount: number(row.amount),
      requestedAt: text(row.created_at),
      status,
      bankName: text(destination.bank_code) || undefined,
      bankAccount: text(destination.account_number) || undefined,
      accountHolder: text(destination.account_name) || undefined,
      referenceCode: text(row.payout_reference) || text(row.completed_transaction_id) || text(row.transaction_id) || undefined,
      payoutProviderStatus,
    }];
  });
}

export async function setWithdrawalStatus(id: string, status: WithdrawalStatus): Promise<AdminWithdrawal> {
  if (status === "approved") await adminApi.approveRefundRequest(id);
  else if (status === "rejected") {
    await adminApi.rejectRefundRequest(id, { reason: "Yêu cầu rút tiền không đủ điều kiện xử lý." });
  } else {
    throw new Error("Chỉ có thể duyệt hoặc từ chối yêu cầu đang chờ.");
  }
  const row = (await getWithdrawals()).find((request) => request.id === id);
  if (!row) throw new Error("Đã cập nhật yêu cầu nhưng không tìm thấy kết quả trong hàng đợi.");
  return row;
}

export async function processWithdrawalPayout(id: string): Promise<AdminWithdrawal> {
  await adminApi.processWithdrawalPayout(id);
  const row = (await getWithdrawals()).find((request) => request.id === id);
  if (!row) throw new Error("Đã gửi yêu cầu PayOS nhưng không tìm thấy kết quả trong hàng đợi.");
  return row;
}

export async function getFinance(): Promise<FinanceSummary> {
  return adminApi.getFinanceSummary();
}
