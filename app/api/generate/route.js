import { NextResponse } from "next/server";
import OpenAI from "openai";
import { QUESTIONS } from "@/lib/questions";

// Node.jsランタイムで動作させる
export const runtime = "nodejs";

const SYSTEM_PROMPT = `あなたはパーソナルジムに通っている会員として、Googleにリアルな口コミを書くプロのライターです。

【前提：これからのGoogle口コミで評価される"質"】
GoogleマップやAIは、口コミの「件数」だけでなく「具体性」と「感情」まで見て、お店の魅力や信頼性を判断します。
だからこの口コミは、次の2つを必ず満たしてください。
・具体性：何が良かったのかが、抽象的な称賛ではなく"具体的な場面・エピソード"として伝わること
・感情：「また通いたい」「安心した」「自信がついた」のような、書き手の素直な気持ちが自然に伝わること

以下のルールを必ず守ってください:

1. 一人称は「私」「自分」など自然な日本語にする
2. 文字数は180〜380文字程度。Google口コミとして自然な長さに収める
3. ステマっぽい大げさな表現や、AI生成っぽい紋切り型の言い回しは避ける
4. 「★5つです！」「絶対おすすめ！」など過度な称賛は使わない
5. 体験談として自然に読める語り口にする（友人に話すような温度感）
6. パーソナルジム/フィットネスの文脈に合った言葉（マンツーマン、フォーム、追い込み、食事指導、ボディメイク など）を自然に織り交ぜる
7. 医療的な効果効能を断定する表現や、過度な数値表現（"必ず痩せる""絶対結果が出る"等）は使わない。"自分には合っていた""続けやすかった""数字も結果がついてきた"等に置き換える
8. 絵文字は使わない
9. 改行は2〜3回程度で読みやすく
10. ジム名が指定されていれば、文中で1回だけ自然に触れる（連呼しない）
11. 「自由入力欄」のユーザー自身の言葉は、最も大切な核として必ず反映し、文章の中心に据える
12. 数字（体重・体脂肪等）は本人が選択した範囲のみ使用し、勝手に具体的な数字を盛らない
13. 【具体性】「丁寧だった」「良かった」だけで終わらせず、回答内容をもとに"何が・どんな風に良かったか"が伝わる具体的な一場面を最低1つ入れる（例：フォームを毎回直してくれた／その日の体調に合わせてメニューを変えてくれた 等）
14. 【感情】読み終えたときに書き手の気持ちが伝わるよう、素直な感情の一言を必ず自然に織り込む（「また通いたい」「安心して任せられた」「通うのが楽しみになった」等）。ただし取ってつけたような定型文にはせず、体験と地続きの実感として書く
15. 選択された「率直な気持ち・感情」の回答は、この口コミの読後感を決める最重要要素として、文章の締めくくり付近で自然に反映する`;

function buildUserPrompt({ answers, freeText, clinicName }) {
  const lines = [];
  lines.push("【今回の会員プロフィール】");
  if (clinicName && clinicName.trim()) {
    lines.push(`ジム名: ${clinicName.trim()}`);
  }
  lines.push("");

  for (const q of QUESTIONS) {
    const a = answers?.[q.id];
    if (!a || (Array.isArray(a) && a.length === 0)) continue;
    const valueText = Array.isArray(a) ? a.join("、") : a;
    lines.push(`■ ${q.category} / ${q.label}`);
    lines.push(`  → ${valueText}`);
  }

  lines.push("");
  if (freeText && freeText.trim()) {
    lines.push("【ユーザー本人の言葉（最重要）】");
    lines.push(freeText.trim());
    lines.push("");
    lines.push(
      "上記の本人コメントを口コミの核として、選択肢の情報と自然に組み合わせて、Google口コミに投稿できる文章を1本だけ書いてください。"
    );
  } else {
    lines.push(
      "上記の選択肢情報をもとに、Google口コミに投稿できる文章を1本だけ書いてください。"
    );
  }
  lines.push(
    "その際、(1)何が良かったかが伝わる具体的な一場面を必ず入れること、(2)「まし通いたい」「安心した」等の素直な感情が自然に伝わることの2点を、体験談として無理なく満たしてください。"
  );

  return lines.join("\n");
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { answers = {}, freeText = "", clinicName = "" } = body || {};

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenAI APIキーが設定されていません。.env.local にOPENAI_API_KEYを設定してください。",
        },
        { status: 500 }
      );
    }

    const answeredCount = Object.values(answers).filter((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v)
    ).length;
    if (answeredCount === 0) {
      return NextResponse.json(
        { error: "質問に1つ以上回答してください。" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const userPrompt = buildUserPrompt({ answers, freeText, clinicName });

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.85,
      max_tokens: 700,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const review = completion.choices?.[0]?.message?.content?.trim() || "";

    if (!review) {
      return NextResponse.json(
        { error: "口コミの生成に失敗しました。再度お試しください。" },
        { status: 502 }
      );
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error("[/api/generate] error:", err);
    const message =
      err?.error?.message ||
      err?.message ||
      "予期せぬエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
