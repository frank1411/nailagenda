import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILES: Record<string, { path: string; name: string; type: string }> = {
  pptx: {
    path: path.join(process.cwd(), 'MayeNailsArt-Presentacion.pptx'),
    name: 'MayeNailsArt-Presentacion.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  pdf: {
    path: path.join(process.cwd(), 'MayeNailsArt-Presentacion.pdf'),
    name: 'MayeNailsArt-Presentacion.pdf',
    type: 'application/pdf',
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'pdf';

  const file = FILES[format];
  if (!file) {
    return NextResponse.json({ error: 'Formato no válido. Usa ?format=pptx o ?format=pdf' }, { status: 400 });
  }

  try {
    const buffer = fs.readFileSync(file.path);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
}
