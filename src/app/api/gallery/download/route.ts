import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const filename = searchParams.get("filename");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // 从 Blob Storage (或其他源) 获取文件
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch image from storage: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // 使用流式传输，避免大文件占用过多内存
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename || 'image.jpg')}`,
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error during download" }, 
      { status: 500 }
    );
  }
}
