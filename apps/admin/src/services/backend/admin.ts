import { backendGet, backendPatch, backendPost } from "@/lib/backend-api";
import type {
  AdminUsersQueryDto,
  AdminDashboardData,
  ApiObject,
  ApiPage,
  BadgeUpdateDto,
  BookingAdminQueryDto,
  CustomerAdminQueryDto,
  DeadlineExtensionDto,
  IdentityStatusDto,
  PaymentAdminQueryDto,
  PhotographerAdminQueryDto,
  RankUpdateDto,
  ReasonDto,
  RefundCompleteDto,
  RefundQueueQueryDto,
  RefundReviewDto,
  ReportListQueryDto,
  ReportResolveDto,
  ReviewAdminQueryDto,
  ReviewHideDto,
  SubscriptionPaymentReviewDto,
} from "@/types/backend-api";

export const getDashboard = () => backendGet<AdminDashboardData>("/admin/dashboard");

export const listUsers = (query: AdminUsersQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/users", query);

export const getUser = (id: string) =>
  backendGet<ApiObject>(`/admin/users/${encodeURIComponent(id)}`);

export const updateUserStatus = (id: string, body: IdentityStatusDto) =>
  backendPatch<ApiObject, IdentityStatusDto>(`/admin/users/${encodeURIComponent(id)}/status`, body);

export const suspendUser = (id: string) =>
  backendPost<ApiObject>(`/admin/users/${encodeURIComponent(id)}/suspend`);

export const unsuspendUser = (id: string) =>
  backendPost<ApiObject>(`/admin/users/${encodeURIComponent(id)}/unsuspend`);

export const banUser = (id: string) =>
  backendPost<ApiObject>(`/admin/users/${encodeURIComponent(id)}/ban`);

export const listPhotographers = (query: PhotographerAdminQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/photographers", query);

export const getPublicPhotographer = (id: string) =>
  backendGet<ApiObject>(`/photographers/${encodeURIComponent(id)}`);

export const listPhotographerPortfolios = (id: string) =>
  backendGet<{ items: ApiObject[] }>(`/photographers/${encodeURIComponent(id)}/portfolios`);

export const listPhotographerBookingPlans = (id: string) =>
  backendGet<{ items: ApiObject[] }>(`/photographers/${encodeURIComponent(id)}/booking-plans`);

export const approvePhotographer = (id: string) =>
  backendPost<ApiObject>(`/admin/photographers/${encodeURIComponent(id)}/approve`);

export const rejectPhotographer = (id: string, body: ReasonDto) =>
  backendPost<ApiObject, ReasonDto>(`/admin/photographers/${encodeURIComponent(id)}/reject`, body);

export const listCustomers = (query: CustomerAdminQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/customers", query);

export const getCustomer = (id: string) =>
  backendGet<ApiObject>(`/admin/customers/${encodeURIComponent(id)}`);

export const listBookings = (query: BookingAdminQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/bookings", query);

export const cancelBooking = (id: string, body: ReasonDto) =>
  backendPost<ApiObject, ReasonDto>(`/admin/bookings/${encodeURIComponent(id)}/cancel`, body);

export const listReports = (query: ReportListQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/reports", query);

export const getReport = (id: string) =>
  backendGet<ApiObject>(`/admin/reports/${encodeURIComponent(id)}`);

export const resolveReport = (id: string, body: ReportResolveDto) =>
  backendPost<ApiObject, ReportResolveDto>(
    `/admin/reports/${encodeURIComponent(id)}/resolve`,
    body,
  );

export const listReviews = (query: ReviewAdminQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/reviews", query);

export const hideReview = (id: string, body: ReviewHideDto) =>
  backendPost<ApiObject, ReviewHideDto>(`/admin/reviews/${encodeURIComponent(id)}/hide`, body);

export const restoreReview = (id: string) =>
  backendPost<ApiObject>(`/admin/reviews/${encodeURIComponent(id)}/restore`);

export const listPayments = (query: PaymentAdminQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/payments", query);

export const listRefundRequests = (query: RefundQueueQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/admin/refund-requests", query);

export const approveRefundRequest = (id: string, body: RefundReviewDto = {}) =>
  backendPost<ApiObject, RefundReviewDto>(
    `/admin/refund-requests/${encodeURIComponent(id)}/approve`,
    body,
  );

export const rejectRefundRequest = (id: string, body: RefundReviewDto = {}) =>
  backendPost<ApiObject, RefundReviewDto>(
    `/admin/refund-requests/${encodeURIComponent(id)}/reject`,
    body,
  );

export const completeRefundRequest = (id: string, body: RefundCompleteDto = {}) =>
  backendPost<ApiObject, RefundCompleteDto>(
    `/admin/refund-requests/${encodeURIComponent(id)}/complete`,
    body,
  );

export const extendRefundDeadline = (id: string, body: DeadlineExtensionDto) =>
  backendPost<ApiObject, DeadlineExtensionDto>(
    `/admin/refund-requests/${encodeURIComponent(id)}/extend-deadline`,
    body,
  );

export const extendEscrowReleaseDeadline = (bookingId: string, body: DeadlineExtensionDto) =>
  backendPost<ApiObject, DeadlineExtensionDto>(
    `/admin/bookings/${encodeURIComponent(bookingId)}/escrow/extend-release`,
    body,
  );

export const reconcileSubscriptionPayment = (
  paymentId: string,
  body: SubscriptionPaymentReviewDto,
) =>
  backendPost<ApiObject, SubscriptionPaymentReviewDto>(
    `/admin/subscriptions/payments/${encodeURIComponent(paymentId)}/reconcile`,
    body,
  );

export const updateRank = (code: string, body: RankUpdateDto) =>
  backendPatch<ApiObject, RankUpdateDto>(`/admin/ranks/${encodeURIComponent(code)}`, body);

export const updateBadge = (code: string, body: BadgeUpdateDto) =>
  backendPatch<ApiObject, BadgeUpdateDto>(`/admin/badges/${encodeURIComponent(code)}`, body);

export const listRanks = () => backendGet<{ items: ApiObject[] }>("/ranks");

export const listBadges = () => backendGet<{ items: ApiObject[] }>("/badges");
