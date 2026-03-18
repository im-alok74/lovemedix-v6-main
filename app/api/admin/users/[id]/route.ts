import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-server'
import { sql } from '@/lib/db'

// PATCH /api/admin/users/[id] - Update user type and/or status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin'])

    // Await params if it's a Promise (Next.js runtime behavior)
    const resolvedParams = await Promise.resolve(params)
    const userId = Number(resolvedParams.id)
    console.log('[ADMIN USERS] PATCH called with userId:', userId, 'raw:', resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const { user_type, status } = await request.json()

    if (!user_type && !status) {
      return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 })
    }

    // Build dynamic SET clause safely using the tagged template API
    const fields: { column: 'user_type' | 'status'; value: string }[] = []
    if (user_type) {
      fields.push({ column: 'user_type', value: user_type })
    }
    if (status) {
      fields.push({ column: 'status', value: status })
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 })
    }

    // Build a simple dynamic UPDATE using a single tagged template
    const setFragments = []
    if (user_type) {
      setFragments.push(sql`user_type = ${user_type}`)
    }
    if (status) {
      setFragments.push(sql`status = ${status}`)
    }

    // Join the fragments into one SQL snippet
    const setClause = setFragments.reduce(
      (acc, fragment, index) =>
        index === 0 ? sql`${fragment}` : sql`${acc}, ${fragment}`,
      sql``
    )

    await sql`
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (error: any) {
    console.error('[users] Error updating user (id route):', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update user', details: String(error) }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['admin'])

    // Await params if it's a Promise (Next.js runtime behavior)
    const resolvedParams = await Promise.resolve(params)
    const userId = Number(resolvedParams.id)
    console.log('[ADMIN USERS] DELETE called with userId:', userId, 'raw:', resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('[users] Error deleting user (id route):', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete user', details: String(error) }, { status: 500 })
  }
}
