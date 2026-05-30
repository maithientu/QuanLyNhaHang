import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: any) {
  try {
    const supabase = await createClient();

    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;

    const id = paramsResolved?.id;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const body = await request.json();
    const { name, price, description, category_id, preparation_time, is_available, image_url } = body;

    const { data, error } = await supabase
      .from("menu_items")
      .update({ name, price, description, category_id, preparation_time, is_available, image_url })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const supabase = await createClient();

    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;

    const id = paramsResolved?.id;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Xóa món ăn thành công" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}