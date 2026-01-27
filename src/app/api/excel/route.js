import { NextResponse } from 'next/server';
import { saveMergedData, getAllRecords } from '@/app/lib/dbOperations';

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, fileCount } = body;
    
    const result = await saveMergedData(data, fileCount);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = await getAllRecords();
    
    return NextResponse.json({ 
      success: true, 
      records 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch records', details: error.message },
      { status: 500 }
    );
  }
}