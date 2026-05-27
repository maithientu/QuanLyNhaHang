"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, AlertCircle } from "lucide-react";

interface QRScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerDialog({ isOpen, onClose }: QRScannerDialogProps) {
  const router = useRouter();
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // ==========================================
  // ĐÂY LÀ PHẦN 1: Logic xử lý hoãn khởi tạo Camera
  // ==========================================
  useEffect(() => {
    if (!isOpen) return;

    let timer: NodeJS.Timeout;

    timer = setTimeout(() => {
      const scannerId = "webcam-qr-reader";
      const element = document.getElementById(scannerId);

      if (!element) {
        console.warn(
          `Không tìm thấy phần tử HTML với ID: ${scannerId}. Đang thử lại...`,
        );
        return;
      }

      const html5QrcodeScanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        },
        false,
      );

      scannerRef.current = html5QrcodeScanner;

      const onScanSuccess = (decodedText: string) => {
        try {
          if (decodedText.includes("/pos")) {
            html5QrcodeScanner
              .clear()
              .then(() => {
                onClose();
                router.push(decodedText);
              })
              .catch((err) => console.error(err));
          } else {
            setScanError("Mã QR không đúng định dạng của nhà hàng!");
          }
        } catch (err) {
          setScanError("Đọc mã thất bại!");
        }
      };

      const onScanFailure = (error: any) => {
        // Bỏ qua lỗi quét từng khung hình
      };

      try {
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      } catch (renderError) {
        console.error("Lỗi khi render camera:", renderError);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => console.log("Camera đã được giải phóng:", err));
        scannerRef.current = null;
      }
    };
  }, [isOpen, router, onClose]);

  // ==========================================
  // ĐÂY LÀ PHẦN 2: Nơi đặt giao diện khối hiển thị HTML
  // ==========================================
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span>Quét mã QR tại bàn</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {/* Vùng hiển thị camera quét QR */}
          <div
            id="webcam-qr-reader"
            className="w-full overflow-hidden rounded-lg border-2 border-dashed border-muted bg-black/5 min-h-[250px]"
          />

          <p className="text-center text-xs text-muted-foreground">
            Di chuyển Camera điện thoại vào tâm vùng chứa mã QR được dán trên
            bàn ăn của bạn.
          </p>

          {/* Hiển thị thông báo lỗi nếu quét sai định dạng */}
          {scanError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
