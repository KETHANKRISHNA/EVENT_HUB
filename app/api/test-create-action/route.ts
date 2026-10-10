import { NextResponse } from 'next/server'
import { createEventAction } from '@/actions/events'

export async function GET() {
  const data = {
    title: 'API Test Event',
    description: 'A test event description with at least 10 chars',
    category: 'Music',
    city: 'Hyderabad',
    venueName: 'Uppal',
    address: 'uppal stadium',
    startsAt: new Date(Date.now() + 86400000),
    endsAt: new Date(Date.now() + 2 * 86400000),
    bannerUrl: '',
    hasSeating: false
  }

  try {
    const result = await createEventAction(data as any)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ caught: err.message })
  }
}
