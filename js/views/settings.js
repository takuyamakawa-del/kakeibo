// 設定：名前、バックアップ書き出し／読み込み、全データ削除
import { todayKey } from '../domain/dates.js';
import { t } from '../ui/ruby.js';
import { esc, on } from '../ui/dom.js';
import { confirmDialog, toast } from '../ui/dialog.js';

export function render(root, { store, navigate }) {
  const s = store.getState();

  root.innerHTML = `
    <section class="view view-settings">
      <h1 class="view-title">${t('設定')}</h1>

      <div class="card">
        <h2 class="card-title">${t('名前')}</h2>
        <div class="row">
          <input type="text" class="name-input" maxlength="12" value="${esc(s.settings.childName)}" placeholder="なまえ">
          <button type="button" class="btn btn-primary" data-act="name">${t('保存')}</button>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">🎯 ${t('1か月に使う目標')}</h2>
        <p class="muted">${t('毎月この金額までに使うのを目標にします。0にすると目標なしになります。')}</p>
        <div class="row">
          <input type="text" class="goal-input" inputmode="numeric" pattern="[0-9]*" maxlength="6"
            value="${s.settings.monthlyGoal || ''}" placeholder="れい：500">
          <span class="unit">${t('円')}</span>
          <button type="button" class="btn btn-primary" data-act="goal">${t('保存')}</button>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">バックアップ <small>（おうちの${t('人')}と）</small></h2>
        <p class="muted">${t('データはこのiPadの中だけに保存されています。ときどき書き出しておくと安心です。')}</p>
        <div class="row wrap">
          <button type="button" class="btn btn-plain" data-act="export">📤 ${t('書き出す')}</button>
          <label class="btn btn-plain">📥 ${t('読み込む')}<input type="file" class="file-input" accept="application/json,.json" hidden></label>
        </div>
      </div>

      <div class="card danger-zone">
        <h2 class="card-title">${t('全部消す')}</h2>
        <p class="muted">${t('記録・花丸・キャラクターの成長がすべて消えます。')}</p>
        <button type="button" class="btn btn-danger" data-act="reset">🗑 ${t('全部消す')}</button>
      </div>
    </section>`;

  on(root, 'click', '[data-act]', async (_e, el) => {
    switch (el.dataset.act) {
      case 'goal': {
        const raw = root.querySelector('.goal-input').value.trim().replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
        const amount = raw === '' ? 0 : Number(raw);
        try {
          store.setMonthlyGoal(amount);
          toast(amount ? '目標を保存しました' : '目標をなしにしました');
        } catch {
          toast('0〜999999の数字で入れてね', { kind: 'error' });
        }
        break;
      }
      case 'name': {
        store.updateSettings({ childName: root.querySelector('.name-input').value.trim() });
        toast('保存しました');
        break;
      }
      case 'export': {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const filename = `kakeibo-backup-${todayKey()}.json`;
        const file = new File([blob], filename, { type: 'application/json' });
        // iPad では共有シート（「ファイルに保存」等）を優先。使えなければダウンロード。
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: filename }); } catch { /* キャンセル */ }
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
        break;
      }
      case 'reset': {
        if (!await confirmDialog('本当に全部消す？', { ok: '消す', danger: true })) return;
        if (!await confirmDialog('もう一度聞くよ。消したら元に戻せません。本当にいい？', { ok: '全部消す', danger: true })) return;
        store.resetAll();
        toast('全部消しました');
        navigate('settings');
        break;
      }
    }
  });

  root.querySelector('.file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    if (!await confirmDialog('今のデータをバックアップの内容で置き換える？', { ok: '置き換える', danger: true })) return;
    try {
      store.importJSON(text);
      toast('読み込みました');
      navigate('settings');
    } catch {
      toast('読み込めませんでした。ファイルを確かめてね', { kind: 'error' });
    }
  });
}
