import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

/**
 * API route to debug admin access issues
 * This route helps diagnose why admin access is not working
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        error: "Non authentifié",
        authenticated: false,
        user: null
      }, { status: 401 });
    }

    const debug: any = {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      },
      adminClient: {
        canCreate: false,
        error: null,
      },
      adminCheck: {
        isAdmin: false,
        error: null,
        adminUser: null,
      },
      tableExists: false,
    };

    // Try to create admin client
    try {
      const adminSupabase = createSupabaseAdminClient();
      debug.adminClient.canCreate = true;
      
      // Check if table exists by trying to query it
      const { data: tableCheck, error: tableError } = await adminSupabase
        .from('admin_users')
        .select('*')
        .limit(1);
      
      if (tableError) {
        if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
          debug.tableExists = false;
          debug.adminCheck.error = 'Table admin_users does not exist';
        } else {
          debug.tableExists = true;
          debug.adminCheck.error = tableError.message;
        }
      } else {
        debug.tableExists = true;
        
        // Check if user is admin
        const { data: adminUser, error: adminError } = await adminSupabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (adminError) {
          if (adminError.code === 'PGRST116') {
            debug.adminCheck.isAdmin = false;
            debug.adminCheck.error = 'User is not in admin_users table';
          } else {
            debug.adminCheck.isAdmin = false;
            debug.adminCheck.error = adminError.message;
          }
        } else {
          debug.adminCheck.isAdmin = true;
          debug.adminCheck.adminUser = adminUser;
        }
      }
    } catch (clientError: any) {
      debug.adminClient.canCreate = false;
      debug.adminClient.error = clientError.message;
    }

    return NextResponse.json(debug);
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

