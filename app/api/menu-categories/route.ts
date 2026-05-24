import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: menuCategories, error } = await supabase
    .from("menu_categories")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(menuCategories);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: "Category name is required" },
      { status: 400 },
    );
  }

  // Check for duplicate name
  const { data: existingCategory, error: fetchError } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("name", name)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 means no rows found
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existingCategory) {
    return NextResponse.json(
      { error: "Category with this name already exists" },
      { status: 409 },
    );
  }

  const { data: newCategory, error } = await supabase
    .from("menu_categories")
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(newCategory, { status: 201 });
}
