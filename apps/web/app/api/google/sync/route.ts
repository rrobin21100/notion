import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load stored tokens
  const { data: conn } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!conn) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
  }

  let accessToken = conn.access_token

  // Refresh token if expired
  const isExpired = conn.token_expires_at
    ? new Date(conn.token_expires_at) < new Date(Date.now() + 60_000)
    : false

  if (isExpired && conn.refresh_token) {
    const newToken = await refreshAccessToken(conn.refresh_token)
    if (!newToken) {
      return NextResponse.json({ error: 'Token refresh failed — please reconnect Google Calendar' }, { status: 401 })
    }
    accessToken = newToken
    await supabase.from('google_calendar_connections').update({
      access_token: newToken,
      token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }).eq('user_id', user.id)
  }

  // Fetch calendars list so we sync all calendars (primary + others)
  const calsRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!calsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 502 })
  }
  const calsData = await calsRes.json()
  const calendarIds: string[] = (calsData.items ?? []).map((c: { id: string }) => c.id)

  // Fetch events from the next 60 days across all calendars
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  let imported = 0

  for (const calId of calendarIds) {
    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?` +
      new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      }),
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!eventsRes.ok) continue

    const eventsData = await eventsRes.json()
    const items = eventsData.items ?? []

    for (const item of items) {
      if (item.status === 'cancelled') continue

      const startAt = item.start?.dateTime ?? item.start?.date
      const endAt = item.end?.dateTime ?? item.end?.date
      const allDay = !item.start?.dateTime

      if (!startAt) continue

      await supabase.from('events').upsert({
        user_id: user.id,
        google_event_id: item.id,
        title: item.summary ?? '(No title)',
        description: item.description ?? null,
        event_type: 'google_calendar',
        start_at: allDay ? `${startAt}T00:00:00` : startAt,
        end_at: endAt ? (allDay ? `${endAt}T00:00:00` : endAt) : null,
        location: item.location ?? null,
        all_day: allDay,
        source: 'google',
      }, {
        onConflict: 'user_id,google_event_id',
        ignoreDuplicates: false,
      })

      imported++
    }
  }

  return NextResponse.json({ imported })
}
