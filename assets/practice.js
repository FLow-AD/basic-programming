/*
  practice.js
  Version: 1.0
  Date: 2026-10-05
  Changes: v1.0 first version. Adds a "self-check practice" widget used on
  week02.html (Lists & Tuples), week03.html (Dictionaries), and
  week04.html (Sets): a student types their NIM, and five short questions
  are generated client-side with their NIM as a random seed (via a
  seeded PRNG, mulberry32, keyed off a hash of the NIM string). The same
  NIM always regenerates the identical set of questions -- so a student
  can retry -- while different NIMs get different questions, values, and
  (for dictionaries) different missing/present keys, discouraging
  answer-sharing. Answers are revealed on click, locally, with a short
  explanation; nothing is submitted or graded -- this is a self-check
  companion to the real per-NIM assignments distributed separately via
  MORNING (see each page's "Tugas"/"assignment" callout), not a
  replacement for them.

  Design notes for future edits:
  - Set questions deliberately never ask a student to predict the
    printed order of a set's elements, because Python sets are
    unordered and real print order isn't something this file can (or
    should) promise to match -- relation questions (subset/superset/
    disjoint) use True/False, and content questions show the answer
    sorted, with the prompt saying so.
  - Dictionary questions rely on Python 3.7+ insertion-order semantics
    (guaranteed), which the "update" question (D5) models precisely:
    adding a new key appends it at the end; overwriting an existing key
    changes its value in place without moving it.
  - Slice generation (list T2) is intentionally restricted to
    non-negative indices and a positive step, to keep the slicing rule
    unambiguous for a student still learning it; negative-index slicing
    is not covered here.
  - Every generated "code" block is meant to be valid, literally
    runnable Python matching the shown scenario, so it can be checked
    by pasting it into a real interpreter -- this was also how the
    question bank itself was verified before publishing (each generator
    was run for many seeds and cross-checked against actual Python
    execution).
*/
(function () {
  'use strict';

  // ---------- Seeded PRNG ----------
  function hashSeed(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function sample(arr, n, rng) {
    return shuffle(arr, rng).slice(0, n);
  }

  // ---------- Python-repr-style formatting ----------
  function pyStrRepr(s) {
    return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }
  function pyVal(v) { return typeof v === 'string' ? pyStrRepr(v) : String(v); }
  function pyListRepr(arr) { return '[' + arr.map(pyVal).join(', ') + ']'; }
  function pyTupleRepr(arr) {
    if (arr.length === 1) return '(' + pyVal(arr[0]) + ',)';
    return '(' + arr.map(pyVal).join(', ') + ')';
  }
  function pyDictRepr(pairs) {
    return '{' + pairs.map(function (p) { return pyVal(p[0]) + ': ' + pyVal(p[1]); }).join(', ') + '}';
  }
  function pySetReprSorted(arr) {
    var sorted = arr.slice().sort(function (a, b) {
      return typeof a === 'number' ? a - b : String(a).localeCompare(String(b));
    });
    return '{' + sorted.map(pyVal).join(', ') + '}';
  }
  function pyIndex(arr, idx) { return idx >= 0 ? arr[idx] : arr[arr.length + idx]; }

  // ---------- Shared data pools ----------
  var FRUITS = ['apel', 'jeruk', 'mangga', 'pisang', 'anggur', 'nanas', 'melon', 'stroberi', 'pepaya', 'kiwi', 'alpukat', 'duku'];
  var CAPITALS = [
    ['Indonesia', 'Jakarta'], ['Japan', 'Tokyo'], ['France', 'Paris'], ['Egypt', 'Cairo'],
    ['Brazil', 'Brasilia'], ['Canada', 'Ottawa'], ['Kenya', 'Nairobi'], ['Norway', 'Oslo'],
    ['Peru', 'Lima'], ['Vietnam', 'Hanoi']
  ];
  var NUM_POOL = Array.from({ length: 50 }, function (_, i) { return i + 1; });
  var SET_POOL = Array.from({ length: 20 }, function (_, i) { return i + 1; });

  // ---------- Lists & Tuples (week02.html, Indonesian) ----------
  function genListsQuestions(rng) {
    var qs = [];

    (function indexing() {
      var n = randInt(rng, 5, 6);
      var items = sample(FRUITS, n, rng);
      var useNeg = rng() < 0.5;
      var idx = useNeg ? -randInt(rng, 1, n) : randInt(rng, 0, n - 1);
      var code = 'buah = ' + pyListRepr(items) + '\nbuah[' + idx + ']';
      var result = pyIndex(items, idx);
      qs.push({
        prompt: 'Apa hasil dari potongan kode berikut?',
        code: code,
        answer: pyVal(result),
        explanation: idx >= 0
          ? 'Indeks dihitung dari 0 di sisi kiri, jadi indeks ' + idx + ' adalah elemen ke-' + (idx + 1) + ' dari kiri.'
          : 'Indeks negatif dihitung dari kanan, mulai -1 untuk elemen terakhir. Indeks ' + idx + ' berarti elemen ke-' + Math.abs(idx) + ' dari kanan.'
      });
    })();

    (function slicing() {
      var n = randInt(rng, 6, 7);
      var items = sample(FRUITS, n, rng);
      var start = randInt(rng, 0, n - 3);
      var end = randInt(rng, start + 2, n);
      var useStep = rng() < 0.35;
      var step = useStep ? 2 : 1;
      var sliced = items.filter(function (_, i) { return i >= start && i < end && (i - start) % step === 0; });
      var sliceExpr = useStep ? ('buah[' + start + ':' + end + ':' + step + ']') : ('buah[' + start + ':' + end + ']');
      var code = 'buah = ' + pyListRepr(items) + '\n' + sliceExpr;
      qs.push({
        prompt: 'Apa hasil dari slicing berikut?',
        code: code,
        answer: pyListRepr(sliced),
        explanation: 'Slicing mengambil elemen dari indeks ' + start + ' sampai sebelum indeks ' + end +
          (useStep ? (', melompat tiap ' + step + ' elemen') : '') + '. Batas akhir (' + end + ') sendiri tidak ikut terambil.'
      });
    })();

    (function methodEffect() {
      var n = randInt(rng, 4, 5);
      var nums = sample(NUM_POOL, n, rng);
      var methods = ['append', 'pop_index', 'pop_last', 'insert', 'remove', 'sort', 'reverse'];
      var method = methods[randInt(rng, 0, methods.length - 1)];
      var result = nums.slice();
      var callLine = '';
      var explanation = '';
      if (method === 'append') {
        var v1 = randInt(rng, 1, 99);
        result.push(v1);
        callLine = 'angka.append(' + v1 + ')';
        explanation = 'append() menambahkan satu elemen baru di posisi paling akhir.';
      } else if (method === 'pop_index') {
        var i1 = randInt(rng, 0, n - 1);
        result.splice(i1, 1);
        callLine = 'angka.pop(' + i1 + ')';
        explanation = 'pop(i) menghapus dan mengembalikan elemen pada indeks i; sisanya ' + (n - 1) + ' elemen, elemen pada indeks ' + i1 + ' tidak lagi ada.';
      } else if (method === 'pop_last') {
        result.pop();
        callLine = 'angka.pop()';
        explanation = 'pop() tanpa argumen menghapus elemen paling akhir.';
      } else if (method === 'insert') {
        var i2 = randInt(rng, 0, n);
        var v2 = randInt(rng, 1, 99);
        result.splice(i2, 0, v2);
        callLine = 'angka.insert(' + i2 + ', ' + v2 + ')';
        explanation = 'insert(i, v) menyisipkan v tepat sebelum indeks i; elemen setelahnya bergeser ke kanan.';
      } else if (method === 'remove') {
        var v3 = nums[randInt(rng, 0, n - 1)];
        var i3 = result.indexOf(v3);
        result.splice(i3, 1);
        callLine = 'angka.remove(' + v3 + ')';
        explanation = 'remove(v) mencari kemunculan pertama nilai v lalu menghapusnya -- berdasarkan nilainya, bukan posisinya.';
      } else if (method === 'sort') {
        result.sort(function (a, b) { return a - b; });
        callLine = 'angka.sort()';
        explanation = 'sort() mengurutkan isi list menaik, mengubah list itu sendiri (in-place).';
      } else {
        result.reverse();
        callLine = 'angka.reverse()';
        explanation = 'reverse() membalik urutan list apa adanya, tanpa mengurutkan nilainya.';
      }
      var code = 'angka = ' + pyListRepr(nums) + '\n' + callLine + '\nangka';
      qs.push({
        prompt: 'Setelah baris kedua dijalankan, apa isi `angka`?',
        code: code,
        answer: pyListRepr(result),
        explanation: explanation
      });
    })();

    (function aliasVsCopy() {
      var n = randInt(rng, 3, 4);
      var items = sample(FRUITS, n, rng);
      var modes = ['alias', 'copy_method', 'slice_copy'];
      var mode = modes[randInt(rng, 0, modes.length - 1)];
      var assignLine = mode === 'alias' ? 'b = a' : (mode === 'copy_method' ? 'b = a.copy()' : 'b = a[:]');
      var code = 'a = ' + pyListRepr(items) + '\n' + assignLine + "\na[0] = 'BARU'\nb[0]";
      var isAlias = mode === 'alias';
      var answer = isAlias ? pyVal('BARU') : pyVal(items[0]);
      qs.push({
        prompt: 'Apa hasil dari `b[0]` setelah ketiga baris di atas dijalankan?',
        code: code,
        answer: answer,
        explanation: isAlias
          ? '`b = a` tidak membuat list baru -- b dan a adalah dua nama untuk list yang sama, jadi perubahan lewat a juga terlihat lewat b.'
          : ('`' + (mode === 'copy_method' ? '.copy()' : '[:]') + '` membuat list baru yang independen, jadi mengubah a tidak memengaruhi b.')
      });
    })();

    (function tupleUnpacking() {
      var n = randInt(rng, 3, 4);
      var vals = sample(FRUITS, n, rng);
      var varNames = ['p', 'q', 'r', 's'].slice(0, n);
      var pickIdx = randInt(rng, 0, n - 1);
      var code = 't = ' + pyTupleRepr(vals) + '\n' + varNames.join(', ') + ' = t\n' + varNames[pickIdx];
      qs.push({
        prompt: 'Setelah unpacking, apa isi `' + varNames[pickIdx] + '`?',
        code: code,
        answer: pyVal(vals[pickIdx]),
        explanation: 'Unpacking memasangkan posisi kiri-ke-kanan: `' + varNames[pickIdx] + '` mengambil elemen ke-' + (pickIdx + 1) + ' dari tuple (indeks ' + pickIdx + ').'
      });
    })();

    return qs;
  }

  // ---------- Dictionaries (week03.html, English) ----------
  function genDictQuestions(rng) {
    var qs = [];
    var pairs = sample(CAPITALS, randInt(rng, 4, 5), rng);
    var notIncluded = CAPITALS.filter(function (p) {
      return !pairs.some(function (q) { return q[0] === p[0]; });
    });

    (function lookupExisting() {
      var idx = randInt(rng, 0, pairs.length - 1);
      var key = pairs[idx][0];
      var code = 'capitals = ' + pyDictRepr(pairs) + "\ncapitals['" + key + "']";
      qs.push({
        prompt: 'What does this evaluate to?',
        code: code,
        answer: pyVal(pairs[idx][1]),
        explanation: 'Dictionary access looks up the value stored under that exact key.'
      });
    })();

    (function lookupMissing() {
      var missing = notIncluded[randInt(rng, 0, notIncluded.length - 1)][0];
      var code = 'capitals = ' + pyDictRepr(pairs) + "\ncapitals['" + missing + "']";
      qs.push({
        prompt: 'What happens when this runs?',
        code: code,
        answer: "KeyError: '" + missing + "'",
        explanation: "'" + missing + "' was never added as a key in this dictionary, so indexing with it raises a KeyError instead of returning a value."
      });
    })();

    (function membership() {
      var useExisting = rng() < 0.5;
      var key = useExisting
        ? pairs[randInt(rng, 0, pairs.length - 1)][0]
        : notIncluded[randInt(rng, 0, notIncluded.length - 1)][0];
      var code = 'capitals = ' + pyDictRepr(pairs) + "\n'" + key + "' in capitals";
      qs.push({
        prompt: 'True or False?',
        code: code,
        answer: useExisting ? 'True' : 'False',
        explanation: '`in` on a dictionary checks its keys only -- ' +
          (useExisting ? ("'" + key + "' is one of the keys here.") : ("'" + key + "' was never added as a key here."))
      });
    })();

    (function lengthQ() {
      var code = 'capitals = ' + pyDictRepr(pairs) + '\nlen(capitals)';
      qs.push({
        prompt: 'What does this evaluate to?',
        code: code,
        answer: String(pairs.length),
        explanation: 'len() on a dictionary counts its key-value pairs: there are ' + pairs.length + ' here.'
      });
    })();

    (function updateOrAdd() {
      var addNew = rng() < 0.5;
      var key, value, resultPairs;
      if (addNew) {
        var pick = notIncluded[randInt(rng, 0, notIncluded.length - 1)];
        key = pick[0];
        value = pick[1];
        resultPairs = pairs.concat([[key, value]]);
      } else {
        var idx2 = randInt(rng, 0, pairs.length - 1);
        key = pairs[idx2][0];
        value = pairs[idx2][1] + ' City';
        resultPairs = pairs.map(function (p, i) { return i === idx2 ? [key, value] : p; });
      }
      var code = 'capitals = ' + pyDictRepr(pairs) + "\ncapitals['" + key + "'] = '" + value + "'\ncapitals";
      qs.push({
        prompt: 'What does `capitals` look like after this runs?',
        code: code,
        answer: pyDictRepr(resultPairs),
        explanation: addNew
          ? ("'" + key + "' is a new key, so it's added at the end -- dictionaries keep insertion order (Python 3.7+).")
          : ("'" + key + "' already existed, so its value is overwritten in place; it does not move to the end.")
      });
    })();

    return qs;
  }

  // ---------- Sets (week04.html, Indonesian) ----------
  function genSetsQuestions(rng) {
    var qs = [];

    function twoSets() {
      var shuffled = shuffle(SET_POOL, rng);
      var overlapN = randInt(rng, 1, 3);
      var onlyAN = randInt(rng, 1, 3);
      var onlyBN = randInt(rng, 1, 3);
      var i = 0;
      var overlap = shuffled.slice(i, i + overlapN); i += overlapN;
      var onlyA = shuffled.slice(i, i + onlyAN); i += onlyAN;
      var onlyB = shuffled.slice(i, i + onlyBN); i += onlyBN;
      var A = shuffle(overlap.concat(onlyA), rng);
      var B = shuffle(overlap.concat(onlyB), rng);
      return { A: A, B: B, overlap: overlap, onlyA: onlyA, onlyB: onlyB };
    }

    (function unionQ() {
      var t = twoSets();
      var union = t.overlap.concat(t.onlyA).concat(t.onlyB);
      var code = 'A = ' + pySetReprSorted(t.A) + '\nB = ' + pySetReprSorted(t.B) + '\nA | B';
      qs.push({
        prompt: 'Apa saja anggota hasilnya? (urutan tidak penting karena set tidak berurutan -- jawaban ditampilkan terurut supaya mudah dicek)',
        code: code,
        answer: pySetReprSorted(union),
        explanation: 'Union (|) menggabungkan semua anggota dari kedua set, tanpa duplikat.'
      });
    })();

    (function intersectionQ() {
      var t = twoSets();
      var inter = t.overlap;
      var code = 'A = ' + pySetReprSorted(t.A) + '\nB = ' + pySetReprSorted(t.B) + '\nA & B';
      qs.push({
        prompt: 'Apa saja anggota hasilnya?',
        code: code,
        answer: inter.length ? pySetReprSorted(inter) : 'set()',
        explanation: inter.length
          ? 'Intersection (&) hanya menyisakan anggota yang muncul di kedua set sekaligus.'
          : 'A dan B di sini tidak punya anggota yang sama, jadi hasilnya set kosong -- ditulis `set()`, bukan `{}` (yang berarti dictionary kosong).'
      });
    })();

    (function differenceQ() {
      var t = twoSets();
      var diff = t.onlyA;
      var code = 'A = ' + pySetReprSorted(t.A) + '\nB = ' + pySetReprSorted(t.B) + '\nA - B';
      qs.push({
        prompt: 'Apa saja anggota hasilnya? (perhatikan urutan operand: A - B, bukan B - A)',
        code: code,
        answer: diff.length ? pySetReprSorted(diff) : 'set()',
        explanation: 'A - B menyisakan anggota A yang TIDAK ada di B. Operasi ini tidak simetris: B - A bisa menghasilkan sesuatu yang berbeda.'
      });
    })();

    (function lengthQ() {
      var n = randInt(rng, 3, 6);
      var items = sample(SET_POOL, n, rng);
      var code = 'A = ' + pySetReprSorted(items) + '\nlen(A)';
      qs.push({
        prompt: 'Apa hasil dari `len(A)`?',
        code: code,
        answer: String(items.length),
        explanation: 'len() menghitung jumlah anggota unik dalam set.'
      });
    })();

    (function relationQ() {
      var relMode = ['subset', 'superset', 'disjoint', 'neither'][randInt(rng, 0, 3)];
      var A, B, relCode, relAnswer, explanation;
      if (relMode === 'subset') {
        var base1 = sample(SET_POOL, randInt(rng, 4, 5), rng);
        B = base1;
        A = sample(base1, randInt(rng, 2, base1.length - 1), rng);
        relCode = 'A.issubset(B)';
        relAnswer = 'True';
        explanation = 'Semua anggota A juga ada di B, jadi A adalah subset dari B.';
      } else if (relMode === 'superset') {
        var base2 = sample(SET_POOL, randInt(rng, 4, 5), rng);
        A = base2;
        B = sample(base2, randInt(rng, 2, base2.length - 1), rng);
        relCode = 'A.issuperset(B)';
        relAnswer = 'True';
        explanation = 'Semua anggota B juga ada di A, jadi A adalah superset dari B.';
      } else if (relMode === 'disjoint') {
        var shuffled = shuffle(SET_POOL, rng);
        A = shuffled.slice(0, randInt(rng, 3, 4));
        B = shuffled.slice(5, 5 + randInt(rng, 3, 4));
        relCode = 'A.isdisjoint(B)';
        relAnswer = 'True';
        explanation = 'A dan B tidak punya anggota yang sama sama sekali, jadi keduanya disjoint.';
      } else {
        var t = twoSets();
        A = t.A; B = t.B;
        relCode = 'A.issubset(B)';
        relAnswer = 'False';
        explanation = 'A punya anggota yang tidak ada di B, jadi A bukan subset dari B (bandingkan dengan `A.issubset(B)` yang True: semua anggota A perlu ada di B).';
      }
      var code = 'A = ' + pySetReprSorted(A) + '\nB = ' + pySetReprSorted(B) + '\n' + relCode;
      qs.push({
        prompt: 'True atau False?',
        code: code,
        answer: relAnswer,
        explanation: explanation
      });
    })();

    return qs;
  }

  var TOPIC_GENERATORS = { lists: genListsQuestions, dicts: genDictQuestions, sets: genSetsQuestions };

  // ---------- Rendering & wiring ----------
  function escapeHTML(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderQuestions(container, questions, labels) {
    container.innerHTML = '';
    questions.forEach(function (q, i) {
      var card = document.createElement('div');
      card.className = 'practice-card';
      card.innerHTML =
        '<p class="practice-qnum">' + escapeHTML(labels.qLabel) + ' ' + (i + 1) + '</p>' +
        '<p>' + escapeHTML(q.prompt) + '</p>' +
        '<pre><code>' + escapeHTML(q.code) + '</code></pre>' +
        '<button type="button" class="practice-reveal-btn" aria-expanded="false">' + escapeHTML(labels.revealLabel) + '</button>' +
        '<div class="practice-answer" hidden>' +
          '<pre><code>' + escapeHTML(q.answer) + '</code></pre>' +
          '<p class="reveal-note">' + escapeHTML(q.explanation) + '</p>' +
        '</div>';
      var btn = card.querySelector('.practice-reveal-btn');
      var ans = card.querySelector('.practice-answer');
      btn.addEventListener('click', function () {
        var isHidden = ans.hasAttribute('hidden');
        if (isHidden) {
          ans.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          ans.setAttribute('hidden', '');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
      container.appendChild(card);
    });
  }

  function initPracticeWidgets() {
    var widgets = document.querySelectorAll('.practice-widget');
    widgets.forEach(function (widget) {
      var topic = widget.getAttribute('data-topic');
      var gen = TOPIC_GENERATORS[topic];
      if (!gen) return;
      var input = widget.querySelector('.practice-nrp-input');
      var btn = widget.querySelector('.practice-generate-btn');
      var out = widget.querySelector('.practice-questions');
      var errEl = widget.querySelector('.practice-error-msg');
      var labels = {
        qLabel: widget.getAttribute('data-q-label') || 'Soal',
        revealLabel: widget.getAttribute('data-reveal-label') || 'Tampilkan jawaban'
      };

      function generate() {
        var nrp = (input.value || '').trim();
        if (errEl) errEl.textContent = '';
        if (!nrp) {
          if (errEl) errEl.textContent = widget.getAttribute('data-empty-msg') || 'Masukkan NIM dulu.';
          out.innerHTML = '';
          return;
        }
        try { window.localStorage.setItem('practice-nrp', nrp); } catch (e) { /* ignore: storage may be unavailable */ }
        var seed = hashSeed(nrp);
        var rng = mulberry32(seed);
        var questions = gen(rng);
        renderQuestions(out, questions, labels);
      }

      btn.addEventListener('click', generate);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); generate(); }
      });

      try {
        var saved = window.localStorage.getItem('practice-nrp');
        if (saved) input.value = saved;
      } catch (e) { /* ignore: storage may be unavailable */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPracticeWidgets);
  } else {
    initPracticeWidgets();
  }
})();
