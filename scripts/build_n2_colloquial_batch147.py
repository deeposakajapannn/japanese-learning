#!/usr/bin/env python3
"""生成独立 JSON：N2 口语 147 条（不并入 sentences.json）。需项目 .venv（pykakasi）。"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from pykakasi import kakasi

ROOT = Path(__file__).resolve().parents[1]
WORDS_FILE = ROOT / "scripts" / "n2_colloquial_147_words.txt"
OUT_FILE = ROOT / "public" / "data" / "sentences_n2_colloquial_batch147.json"

# 与 n2_colloquial_147_words.txt 行序一一对应（147 条）
META: list[tuple[str, str, str]] = [
    ("不用那么在意吧？", "You don't have to worry about it that much, do you?", "日常场景"),
    ("那个，我好像以前也听过。", "I feel like I've heard that before.", "日常场景"),
    ("事到如今再说我也很难办啊。", "Hearing that now puts me in a tough spot.", "人际关系"),
    ("哎，你今天是不是特别困？", "Don't you feel super sleepy today for some reason?", "日常场景"),
    ("你要是能早点告诉我就好了。", "I wish you had told me a bit earlier.", "人际关系"),
    ("我觉得不用想得那么深啦。", "I don't think you need to think that deeply.", "思考议论"),
    ("说实话，我没抱太大期待。", "To be honest, I didn't expect much.", "情绪心理"),
    ("我不是那个意思才那么说的。", "That's not what I meant when I said that.", "人际关系"),
    ("回过神来已经这个点了。", "Before I knew it, it had gotten this late.", "日常生活"),
    ("所以那到底什么意思？", "So what does that actually mean in the end?", "思考议论"),
    ("总有种不祥的预感。", "I've got a bad feeling about this.", "情绪心理"),
    ("我觉得没必要硬去配合。", "I don't think you need to force yourself to go along.", "人际关系"),
    ("比想象的好太多了。", "It was way better than I thought.", "情绪心理"),
    ("能让我稍微想想吗？", "Could you give me a little time to think?", "日常场景"),
    ("那件事，到底有多少是真的？", "How much of that story is actually true?", "思考议论"),
    ("既然要做就做到最后吧。", "If we're doing it, I'd rather see it through.", "思考议论"),
    ("能那么轻易就决定吗？", "Is it okay to decide that easily?", "思考议论"),
    ("目前看来没什么问题。", "So far it doesn't look like a problem.", "日常场景"),
    ("那也太过头了吧？", "Isn't that going a bit too far?", "人际关系"),
    ("我完全搞不懂为什么会变成那样。", "I have no idea why it turned out that way.", "思考议论"),
    ("最好再观望一下吧。", "Maybe you should wait and see a bit longer.", "思考议论"),
    ("你不觉得那说法有点冲吗？", "Don't you think that was a bit harsh?", "人际关系"),
    ("我们先理一理再聊吧。", "Let's sort things out before we talk.", "人际关系"),
    ("我可没义务被说到那份上。", "I don't deserve to be told that much.", "人际关系"),
    ("总觉得没法接受啊。", "Somehow I just can't accept it.", "情绪心理"),
    ("反正结果都一样吧。", "Either way, I think the result would be the same.", "思考议论"),
    ("被你这么一说，好像确实如此。", "Now that you mention it, maybe you're right.", "人际关系"),
    ("我会尽快处理的。", "I'll deal with it as soon as I can.", "工作职场"),
    ("再往下就有点难了。", "Anything more would be pretty tough.", "日常场景"),
    ("不知不觉就变成那样了。", "It just kind of ended up that way.", "日常场景"),
    ("现在回想，也许那就是契机吧。", "Looking back, maybe that was the trigger.", "思考议论"),
    ("今天就先到这儿吧。", "Let's call it a day for today.", "日常场景"),
    ("那个，你之后能详细跟我说说吗？", "Could you explain that in more detail later?", "人际关系"),
    ("突然跟我说那种事我也做不到啊。", "You can't just spring that on me.", "人际关系"),
    ("那一点希望你能好好说明。", "I need you to explain that part properly.", "人际关系"),
    ("总觉得话对不上。", "I feel like we're not quite on the same page.", "人际关系"),
    ("要不要试试别的方法？", "Why not try another way?", "思考议论"),
    ("都走到这步了，只能上了吧。", "We've come this far—we've got to do it.", "思考议论"),
    ("好像是个小误会。", "Looks like it was a small misunderstanding.", "人际关系"),
    ("别太勉强自己比较好哦。", "You'd better not push yourself too hard.", "情绪心理"),
    ("你是认真的吗？", "Are you serious about that?", "日常场景"),
    ("心情我理解，但现实很残酷啊。", "I get how you feel, but reality is harsh.", "思考议论"),
    ("也可以再灵活一点想啦。", "You could think about it a bit more flexibly.", "思考议论"),
    ("那种想法也不错啊。", "That way of thinking works too.", "思考议论"),
    ("折腾归折腾，还算顺利啦。", "Somehow it all worked out in the end.", "日常场景"),
    ("现在还不好说呢。", "It's still too soon to say.", "思考议论"),
    ("不用照顾到那种程度啦。", "You don't have to be that considerate.", "人际关系"),
    ("有时候过程比结果更重要哦。", "Sometimes the process matters more than the result.", "思考议论"),
    ("本来想去，突然有事去不了了。", "I was going to go, but something came up and I can't.", "日常场景"),
    ("试是试了，比想的难多了。", "I tried, but it was harder than I thought.", "日语学习"),
    ("道理我都懂，就是动不起来。", "I know it in my head, but I can't act on it.", "情绪心理"),
    ("想去是想去，现在有点腾不出空。", "I'd like to, but I don't have the bandwidth right now.", "日常场景"),
    ("我觉得自己挺努力了，可结果跟不上。", "I thought I was trying hard, but the results didn't follow.", "工作职场"),
    ("便宜是便宜，质量有点让人担心。", "It's cheap, but I'm a bit worried about the quality.", "购物"),
    ("不算差，但总觉得少了点什么。", "It's not bad, but something feels missing.", "情绪心理"),
    ("理由明白，但没法接受。", "I get the reason, but I can't agree.", "思考议论"),
    ("时间其实是有的，结果什么也没做成。", "I had time, but in the end I did nothing.", "日常生活"),
    ("本想早点睡，一回神都这么晚了。", "I meant to sleep early, but look at the time now.", "日常生活"),
    ("没打算买的，一时冲动就买了。", "I wasn't planning to buy it, but I impulse-bought it.", "购物"),
    ("以为能赶上，电车晚点没赶上。", "I thought I'd make it, but the train was late.", "交通出行"),
    ("没抱多大期待，意外挺有意思。", "I didn't expect much, but it was surprisingly fun.", "兴趣娱乐"),
    ("不算讨厌，也称不上喜欢。", "I don't dislike it, but I don't especially like it either.", "人际关系"),
    ("想说其实能说的，但故意没说。", "I could have said it, but I chose not to.", "人际关系"),
    ("机会是有的，可我自己没动。", "There was a chance, but I didn't take the step.", "思考议论"),
    ("不是做不到，就是会很费时。", "It's not impossible, but it would take quite a while.", "工作职场"),
    ("知道你忙，至少联系一下吧。", "I know you're busy, but at least drop a message.", "人际关系"),
    ("应该没恶意吧，但有点失礼。", "I don't think they meant harm, but it was a bit rude.", "人际关系"),
    ("只能做是只能做，说实话心里沉。", "I know I have to, but honestly it weighs on me.", "情绪心理"),
    ("以为都结束了，问题又来了。", "I thought it was over, but another issue popped up.", "工作职场"),
    ("以为会顺利的，完全不行。", "I thought it would work out, but it totally didn't.", "情绪心理"),
    ("确实方便，用过头可不好。", "It's handy for sure, but using it too much isn't good.", "科技网络"),
    ("话我懂，但感觉不适合我。", "I understand the idea, but it doesn't feel right for me.", "思考议论"),
    ("犹豫去不去，最后没去。", "I wasn't sure whether to go, and ended up not going.", "日常场景"),
    ("想见来着，时间对不上。", "I wanted to see them, but the timing didn't work.", "人际关系"),
    ("努力一下也许能行，但没信心。", "I might manage if I try, but I'm not confident.", "情绪心理"),
    ("以为不行，试了试居然可以。", "I thought I couldn't, but when I tried, I could.", "情绪心理"),
    ("以为没什么大不了，影响挺大。", "I didn't think it was a big deal, but the impact was huge.", "思考议论"),
    ("以为很快搞定，花的时间比想的长。", "I thought it'd be quick, but it took way longer.", "工作职场"),
    ("试着不去在意，还是会在意。", "I tried not to care, but I still do.", "情绪心理"),
    ("想忘掉，可怎么也忘不掉。", "I tried to forget, but I can't.", "情绪心理"),
    ("其实不想去，没办法还是去了。", "I didn't want to go, but I had to.", "日常场景"),
    ("看起来简单，掌握窍门却很难。", "It looks easy, but getting the hang of it is hard.", "日语学习"),
    ("试了试，不适合我。", "I tried it, but it wasn't for me.", "日常生活"),
    ("我觉得最好停手，但最终看本人。", "I think you should stop, but it's up to them in the end.", "人际关系"),
    ("以为你能懂，完全没传达到。", "I thought you'd get it, but it didn't get across at all.", "人际关系"),
    ("不是那个意思，却被误解了。", "I didn't mean it that way, but I was misunderstood.", "人际关系"),
    ("主意不错，实现起来很难。", "It's a good idea, but hard to pull off.", "工作职场"),
    ("以为总会有办法，想得太天真了。", "I thought it'd work out—I was naive.", "思考议论"),
    ("想去得不得了，这次就先不去了。", "I really want to go, but I'll sit this one out.", "日常场景"),
    ("不是没时间，就是没干劲。", "It's not that I have no time—I just have no motivation.", "情绪心理"),
    ("不算讨厌，但也不想主动去做。", "I don't hate it, but I'm not eager to do it either.", "思考议论"),
    ("提议不坏，想再考虑考虑。", "It's not a bad proposal—I want to think it over.", "思考议论"),
    ("刚要走就下雨了，最后没去。", "The moment I tried to go, it rained, so I gave up.", "天气自然"),
    ("以为没事，身体比想的差。", "I thought I was fine, but I felt worse than expected.", "健康医疗"),
    ("当时接受了，事后又有疑问。", "I accepted it then, but later I had doubts.", "思考议论"),
    ("本想帮忙，结果什么也没做成。", "I meant to help, but ended up doing nothing.", "人际关系"),
    ("明知浪费，还是忍不住做了。", "I know it's pointless, but I still do it.", "情绪心理"),
    ("不是不能去，就是有点远。", "I could go, but it's a bit far.", "交通出行"),
    ("想做是能做的，只是现在没心情。", "I could if I wanted to—I just don't feel like it now.", "情绪心理"),
    ("不是不懂，就是不接受。", "It's not that I don't understand—I don't accept it.", "思考议论"),
    ("看起来不错，实际怎么样呢。", "It looks good, but how is it really?", "思考议论"),
    ("想去是真的，这次就算了。", "I really want to go, but I'll pass this time.", "日常场景"),
    ("看起来简单，其实挺费事。", "It looked simple, but it was surprisingly tedious.", "日常生活"),
    ("话我听了，还没决定。", "I heard you out, but I haven't decided yet.", "人际关系"),
    ("应该没问题，我再确认一下。", "I think it's fine, but I'll double-check just in case.", "工作职场"),
    ("时间有，干劲跟不上。", "I have time, but my motivation can't keep up.", "情绪心理"),
    ("会在意，但也不一定非要现在。", "It bothers me, but it doesn't have to be right now.", "思考议论"),
    ("能去的话想去，看情况吧。", "I'd like to if I can—it depends on the situation.", "日常场景"),
    ("有兴趣，但没那么了解。", "I'm interested, but I don't know the details.", "思考议论"),
    ("我不觉得坏，只是不适合我。", "I don't think it's bad—it just doesn't suit me.", "思考议论"),
    ("姑且试了，结果一般。", "I gave it a shot, but the result was so-so.", "日常场景"),
    ("不是不可能，就是不太现实。", "It's not impossible, but it's not very realistic.", "思考议论"),
    ("你那么一说我懂，但马上做不到。", "I get it when you put it that way, but I can't right away.", "人际关系"),
    ("想努力，身体跟不上。", "I want to try, but my body can't keep up.", "健康医疗"),
    ("有时间会做，现在优先级低。", "I'll do it when I can—right now it's low priority.", "工作职场"),
    ("本来要去，计划突然变了。", "I was going to go, but plans changed suddenly.", "日常场景"),
    ("好像挺有意思，现在没空。", "It sounds fun, but I don't have the bandwidth now.", "日常场景"),
    ("知道该做，却总往后拖。", "I know I should, but I keep putting it off.", "情绪心理"),
    ("不算讨厌，但我也不会主动做。", "I don't hate it, but I wouldn't do it on my own.", "思考议论"),
    ("想试试，就是没契机。", "I'd like to try—I just need a reason to start.", "思考议论"),
    ("能做的就是做，但不勉强。", "I'll do what I can, but I won't overdo it.", "工作职场"),
    ("确实需要，但也不一定非得现在。", "It is necessary, but maybe not right this minute.", "思考议论"),
    ("希望你能懂我的心情，可我说不好。", "I want you to understand, but I can't put it into words.", "情绪心理"),
    ("那点我理解，但不能完全同意。", "I see that part, but I can't fully agree.", "思考议论"),
    ("我觉得行，想再观望一下。", "I think it's fine—I want to wait and see a bit more.", "思考议论"),
    ("能去就去，别太期待。", "I'll go if I can—don't expect too much.", "人际关系"),
    ("有干劲，准备还不够。", "I'm motivated, but I'm not ready yet.", "工作职场"),
    ("不是做不到，就是没信心。", "It's not that I can't—I just lack confidence.", "情绪心理"),
    ("外观不错，用起来一般。", "It looks good, but usability is so-so.", "购物"),
    ("不算差，但缺少决定性。", "It's not bad, but it's missing a decisive edge.", "思考议论"),
    ("道理懂，心情跟不上。", "I get it in my head, but my heart can't follow.", "情绪心理"),
    ("值得去，但又不至于专程跑一趟。", "It's worth seeing, but not worth a special trip.", "日常场景"),
    ("时间上来得及，余裕不多。", "Time-wise I'm okay, but there's not much margin.", "工作职场"),
    ("有兴趣，但现在有别的事优先。", "I'm interested, but I have other priorities now.", "工作职场"),
    ("该做我知道，就是提不起劲。", "I know I should, but I can't get myself to do it.", "情绪心理"),
    ("我确认过了，暂时没什么问题。", "I checked—nothing obvious for now.", "工作职场"),
    ("想参加，要看日程。", "I'd like to join—it depends on my schedule.", "工作职场"),
    ("当故事听挺有意思，不太现实。", "It's interesting as a story, but not realistic.", "思考议论"),
    ("能办多少办多少，不保证。", "I'll do what I can, but I can't promise.", "工作职场"),
    ("我是打算去，还没定死。", "I'm leaning toward going, but it's not final yet.", "日常场景"),
    ("不是说不行，就是挺严的。", "I'm not saying no, but it's pretty strict.", "工作职场"),
    ("不试不知道，不过有可能。", "You won't know until you try—but there's a chance.", "思考议论"),
    ("主意不坏，也有风险哦。", "It's not a bad idea, but there's risk too.", "工作职场"),
    ("乍一看简单，其实很深。", "It looks simple at first glance, but it's deep.", "思考议论"),
    ("不接受，但先照办吧。", "I don't agree, but I'll go along for now.", "工作职场"),
    ("我是那么打算，看情况再定。", "That's my plan, but I'll decide based on how things go.", "思考议论"),
    ("不完美，但目前这样就行吧。", "It's not perfect, but this is fine for now.", "思考议论"),
]


def build_converter() -> "kakasi":
    k = kakasi()
    k.setMode("J", "H")
    k.setMode("K", "H")
    k.setMode("H", "H")
    return k.getConverter()


def main() -> None:
    if len(META) != 147:
        print("META length must be 147", file=sys.stderr)
        sys.exit(1)
    text = WORDS_FILE.read_text(encoding="utf-8")
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) != 147:
        print(f"words file: expected 147 lines, got {len(lines)}", file=sys.stderr)
        sys.exit(1)
    conv = build_converter()
    out: list[dict] = []
    for i, (word, (m, e, t)) in enumerate(zip(lines, META, strict=True), start=1):
        if word.endswith(("。", "？", "！", "…")):
            w = word
        else:
            w = word + "。"
        reading = conv.do(w)
        out.append(
            {
                "id": i,
                "word": w,
                "reading": reading,
                "meaning": m,
                "level": "N2",
                "meaningEn": e,
                "topic": t,
            }
        )
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} entries to {OUT_FILE}")


if __name__ == "__main__":
    main()
