import { FilesApi } from '@/api/files';
import type { FsEntry } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Настройка воркера pdf.js
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

export type ThumbResult = { url: string; revoke?: () => void } | null;

function drawTextPreview(text: string, w = 600, h = 400): string {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d')!;
    // фон
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);
    // заголовок-строка
    ctx.fillStyle = '#888';
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText('TEXT PREVIEW', 16, 24);
    // сам текст
    ctx.fillStyle = '#222';
    ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    const pad = 16;
    const lineH = 22;
    const maxWidth = w - pad * 2;
    const lines = text.split(/\r?\n/).slice(0, 20);
    let y = 50;
    for (const line of lines) {
        // простая обрезка строки
        let t = line;
        while (ctx.measureText(t).width > maxWidth) {
            t = t.slice(0, t.length - 1);
        }
        ctx.fillText(t, pad, y);
        y += lineH;
        if (y > h - pad) break;
    }
    return c.toDataURL('image/png');
}

async function blobToImageDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            try {
                const c = document.createElement('canvas');
                // Нормируем под миниатюру 600x400 (3:2)
                const targetW = 600, targetH = 400;
                c.width = targetW; c.height = targetH;
                const ctx = c.getContext('2d')!;
                // cover
                const r = Math.max(targetW / img.width, targetH / img.height);
                const nw = img.width * r, nh = img.height * r;
                const nx = (targetW - nw) / 2, ny = (targetH - nh) / 2;
                ctx.drawImage(img, nx, ny, nw, nh);
                resolve(c.toDataURL('image/png'));
            } catch (e) {
                reject(e);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
        img.onerror = reject;
        img.src = url;
    });
}

async function captureVideoFrame(blob: Blob, timeSec = 0.1): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.muted = true;
        v.src = url;
        v.onloadedmetadata = () => {
            const seek = Math.min(timeSec, (v.duration || 1) - 0.05);
            v.currentTime = seek < 0 ? 0 : seek;
        };
        v.onseeked = () => {
            try {
                const c = document.createElement('canvas');
                const targetW = 600, targetH = 400;
                c.width = targetW; c.height = targetH;
                const ctx = c.getContext('2d')!;
                const r = Math.max(targetW / v.videoWidth, targetH / v.videoHeight);
                const nw = v.videoWidth * r, nh = v.videoHeight * r;
                const nx = (targetW - nw) / 2, ny = (targetH - nh) / 2;
                ctx.drawImage(v, nx, ny, nw, nh);
                resolve(c.toDataURL('image/png'));
            } catch (e) {
                reject(e);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
        v.onerror = reject;
    });
}

async function renderPdfFirstPage(blob: Blob): Promise<string> {
    const url = URL.createObjectURL(blob);
    try {
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 }); // увеличим для чёткости
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d')!;
        c.width = viewport.width;
        c.height = viewport.height;
        await page.render({ canvasContext: ctx as any, viewport }).promise;
        // Приведём к 600x400 (cover)
        const targetW = 600, targetH = 400;
        const out = document.createElement('canvas');
        out.width = targetW; out.height = targetH;
        const octx = out.getContext('2d')!;
        const r = Math.max(targetW / c.width, targetH / c.height);
        const nw = c.width * r, nh = c.height * r;
        const nx = (targetW - nw) / 2, ny = (targetH - nh) / 2;
        octx.drawImage(c, nx, ny, nw, nh);
        return out.toDataURL('image/png');
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * Универсальный генератор превью.
 * Возвращает dataURL (png) в url; для простоты не храним revoke.
 */
export async function makeThumbnail(item: FsEntry): Promise<ThumbResult> {
    try {
        if (item.kind === 'folder') return null;

        const mt = (item.mimeType || '').toLowerCase();

        if (mt.startsWith('image/')) {
            const blob = await FilesApi.getContentBlob(item.id);
            const url = await blobToImageDataURL(blob);
            return { url };
        }

        if (mt.startsWith('video/')) {
            const blob = await FilesApi.getContentBlob(item.id);
            const url = await captureVideoFrame(blob, 0.1);
            return { url };
        }

        if (mt === 'application/pdf') {
            const blob = await FilesApi.getContentBlob(item.id);
            const url = await renderPdfFirstPage(blob);
            return { url };
        }

        if (mt.startsWith('text/') || mt === 'application/json' || mt.includes('markdown')) {
            // подтянем текст и нарисуем первые строки
            const { content } = await FilesApi.getText(item.id);
            const url = drawTextPreview(content || '');
            return { url };
        }

        // аудио/прочие — оставим иконку (можно расширить позже)
        return null;
    } catch {
        return null;
    }
}