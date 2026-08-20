import { useState, useEffect, useRef } from 'react';
import { giftImageService } from '../../../core/services/gift-image.service';

/**
 * Hook tải và quản lý vòng đời Object URL cho một ảnh quà tặng đơn lẻ (Full hoặc Thumbnail)
 */
export function useGiftImage(
  giftId?: string,
  mode: 'thumbnail' | 'full' = 'thumbnail',
  imageVersion?: number,
  fallbackImageRef?: string
) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(fallbackImageRef);
  const [loading, setLoading] = useState<boolean>(Boolean(giftId));
  const activeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // Thu hồi URL cũ nếu có
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }

    if (!giftId) {
      setImageUrl(fallbackImageRef);
      setLoading(false);
      return;
    }

    setLoading(true);

    giftImageService
      .getImageByGiftId(giftId)
      .then((giftImage) => {
        if (isCancelled) return;

        if (giftImage) {
          const blob = mode === 'full' ? giftImage.fullBlob : giftImage.thumbnailBlob;
          if (blob instanceof Blob) {
            const objectUrl = URL.createObjectURL(blob);
            activeUrlRef.current = objectUrl;
            setImageUrl(objectUrl);
            setLoading(false);
            return;
          }
        }

        // Fallback sang imageRef nếu không có record trong giftImages
        setImageUrl(fallbackImageRef);
        setLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn(`[useGiftImage] Failed to resolve image for gift ${giftId}:`, err);
          setImageUrl(fallbackImageRef);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    };
  }, [giftId, mode, imageVersion, fallbackImageRef]);

  return { imageUrl, loading };
}

/**
 * Hook tải hàng loạt (Batch) thumbnails cho danh sách quà tặng trong Catalog Grid
 */
export function useBatchGiftThumbnails(giftIds: string[], versionTrigger?: number) {
  const [thumbnailMap, setThumbnailMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const activeUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let isCancelled = false;

    // Dọn dẹp tất cả object URLs của lần tải trước
    activeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeUrlsRef.current = [];

    if (giftIds.length === 0) {
      setThumbnailMap(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);

    giftImageService
      .getBatchThumbnails(giftIds)
      .then((imagesMap) => {
        if (isCancelled) return;

        const newMap = new Map<string, string>();
        const createdUrls: string[] = [];

        imagesMap.forEach((giftImage, gId) => {
          if (giftImage.thumbnailBlob instanceof Blob) {
            const url = URL.createObjectURL(giftImage.thumbnailBlob);
            createdUrls.push(url);
            newMap.set(gId, url);
          }
        });

        activeUrlsRef.current = createdUrls;
        setThumbnailMap(newMap);
        setLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[useBatchGiftThumbnails] Error fetching batch thumbnails:', err);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      activeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      activeUrlsRef.current = [];
    };
  }, [JSON.stringify(giftIds), versionTrigger]);

  return { thumbnailMap, loading };
}
