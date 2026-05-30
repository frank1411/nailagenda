import { NextRequest, NextResponse } from 'next/server';

const FILES: Record<string, { fileName: string; type: string }> = {
  pptx: {
    fileName: 'MayeNailsArt-Presentacion.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  pdf: {
    fileName: 'MayeNailsArt-Presentacion.pdf',
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
    // Construct the public URL to the file in the /public folder
    const fileUrl = new URL(`/${file.fileName}`, request.url).href;
    
    // Fetch the file from the public URL
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file from ${fileUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Archivo no encontrado o error al procesar la descarga' }, { status: 404 });
  }
}
