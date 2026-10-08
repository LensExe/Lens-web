import { DeliveryGalleryPage } from "@/components/storage/DeliveryGalleryPage";

/** Customer gallery entry point. Upload and publish controls stay photographer-only. */
export function CustomerDeliveryGallery() {
  return <DeliveryGalleryPage mode="client" />;
}
