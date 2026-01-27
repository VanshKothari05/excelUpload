import { NextResponse } from 'next/server';
import { getRecordById, deleteRecord } from '@/app/lib/dbOperations';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const record = await getRecordById(id);
    
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      record 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch record', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const result = await deleteRecord(id);
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Record deleted successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete record', details: error.message },
      { status: 500 }
    );
  }
}