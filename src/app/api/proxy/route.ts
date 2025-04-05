import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const NVIDIA_API_KEY = process.env.NEXT_PUBLIC_NVIDIA_API_KEY;
        const invokeUrl = "https://health.api.nvidia.com/v1/biology/nvidia/molmim/generate";

        const payload = await req.json();
        
        const response = await fetch(invokeUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${NVIDIA_API_KEY}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
