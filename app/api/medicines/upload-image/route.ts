import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import crypto from "crypto"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "medicines")

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.user_type !== "distributor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    await ensureUploadDir()

    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${crypto.randomBytes(16).toString("hex")}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const url = `/uploads/medicines/${filename}`
    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("[MEDICINE IMAGE UPLOAD] Error:", error)
    return NextResponse.json(
      { error: "Failed to upload image", details: String(error) },
      { status: 500 }
    )
  }
}

