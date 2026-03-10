/**
 * 公式引擎 — Shunting-Yard 实现
 * 微信小程序禁用 eval/new Function，手写词法+语法解析
 * 支持: + - * / () 变量名 SUM() 聚合
 */

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 }

// 词法分析：将公式字符串拆分为 token 数组
function tokenize(expr) {
  const tokens = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (ch === ' ') { i++; continue }
    if (ch === '(' || ch === ')' || ch === ',' || ch === '+' || ch === '*' || ch === '/') {
      tokens.push(ch)
      i++
      continue
    }
    // 负号：出现在开头或左括号/运算符/逗号后
    if (ch === '-') {
      const prev = tokens[tokens.length - 1]
      if (!prev || prev === '(' || prev === ',' || prev in PRECEDENCE) {
        let num = '-'
        i++
        while (i < expr.length && (isDigitOrDot(expr[i]))) { num += expr[i]; i++ }
        tokens.push({ type: 'num', value: parseFloat(num) })
        continue
      }
      tokens.push('-')
      i++
      continue
    }
    if (isDigitOrDot(ch)) {
      let num = ''
      while (i < expr.length && isDigitOrDot(expr[i])) { num += expr[i]; i++ }
      tokens.push({ type: 'num', value: parseFloat(num) })
      continue
    }
    if (isIdentStart(ch)) {
      let id = ''
      while (i < expr.length && isIdentChar(expr[i])) { id += expr[i]; i++ }
      tokens.push({ type: 'id', value: id })
      continue
    }
    i++
  }
  return tokens
}

function isDigitOrDot(c) { return (c >= '0' && c <= '9') || c === '.' }
function isIdentStart(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' }
function isIdentChar(c) { return isIdentStart(c) || (c >= '0' && c <= '9') }

// Shunting-Yard：中缀 → 后缀（RPN），然后求值
function evalRPN(tokens, vars) {
  const output = []
  const ops = []
  for (const t of tokens) {
    if (typeof t === 'object' && t.type === 'num') {
      output.push(t.value)
    } else if (typeof t === 'object' && t.type === 'id') {
      const v = vars[t.value]
      output.push(typeof v === 'number' ? v : (parseFloat(v) || 0))
    } else if (t in PRECEDENCE) {
      while (ops.length && ops[ops.length - 1] in PRECEDENCE && PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[t]) {
        output.push(ops.pop())
      }
      ops.push(t)
    } else if (t === '(') {
      ops.push(t)
    } else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop())
      ops.pop()
    }
  }
  while (ops.length) output.push(ops.pop())
  // 求值
  const stack = []
  for (const item of output) {
    if (typeof item === 'number') { stack.push(item); continue }
    const b = stack.pop() || 0
    const a = stack.pop() || 0
    if (item === '+') stack.push(a + b)
    else if (item === '-') stack.push(a - b)
    else if (item === '*') stack.push(a * b)
    else if (item === '/') stack.push(b !== 0 ? a / b : 0)
  }
  return stack[0] || 0
}

/**
 * 单行公式计算：代入当前行变量
 * evaluate("hourlyWage * workers / capacity", { hourlyWage: 25, workers: 2, capacity: 100 }) → 0.5
 */
function evaluate(formula, vars) {
  if (!formula || typeof formula !== 'string') return 0
  try {
    const tokens = tokenize(formula.trim())
    return evalRPN(tokens, vars || {})
  } catch (e) {
    return 0
  }
}

/**
 * 汇总公式计算：支持 SUM(sectionKey.fieldKey)
 * 先展开 SUM() 为具体数值，再走普通表达式求值
 */
function evaluateSummary(formula, sections) {
  if (!formula || typeof formula !== 'string') return 0
  try {
    // 展开 SUM(sKey.fKey) → 对应 section 所有行该字段之和
    let expanded = formula.replace(/SUM\(([^)]+)\)/g, function (_, arg) {
      const dot = arg.indexOf('.')
      if (dot === -1) return '0'
      const sKey = arg.substring(0, dot)
      const fKey = arg.substring(dot + 1)
      const sec = sections.find(function (s) { return s.key === sKey })
      if (!sec) return '0'
      let sum = 0
      sec.rows.forEach(function (row) { sum += parseFloat(row[fKey]) || 0 })
      return String(sum)
    })
    return evaluate(expanded, {})
  } catch (e) {
    return 0
  }
}

// 展开 SUM(sKey.fKey) — 跨全局 sections
function expandSUM(expr, allSections) {
  return expr.replace(/SUM\(([^)]+)\)/g, function (_, arg) {
    var dot = arg.indexOf('.')
    if (dot === -1) return '0'
    var sKey = arg.substring(0, dot)
    var fKey = arg.substring(dot + 1)
    var sec = allSections.find(function (s) { return s.key === sKey })
    if (!sec) {
      console.warn('[formula] SUM: 找不到区域 key="' + sKey + '"，可用区域:', allSections.map(function (s) { return s.key }).join(', '))
      return '0'
    }
    var sum = 0
    sec.rows.forEach(function (row) { sum += parseFloat(row[fKey]) || 0 })
    if (sum === 0) {
      console.warn('[formula] SUM(' + sKey + '.' + fKey + ')=0，该区域有' + sec.rows.length + '行，首行keys:', sec.rows.length ? Object.keys(sec.rows[0]).filter(function (k) { return k !== '_formulas' && k !== '_collapsed' }).join(',') : '无')
    }
    return String(sum)
  })
}

// 展开 sKey.fKey[N] 单元格引用 — N 为 1-based 行号
function expandCellRef(expr, allSections) {
  return expr.replace(/([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\[(\d+)\]/g,
    function (_, sKey, fKey, rowNumStr) {
      var rowIdx = parseInt(rowNumStr) - 1
      var sec = allSections.find(function (s) { return s.key === sKey })
      if (!sec || rowIdx < 0 || rowIdx >= sec.rows.length) return '0'
      return String(parseFloat(sec.rows[rowIdx][fKey]) || 0)
    }
  )
}

// 全局公式入口：先展开 SUM + 单元格引用，再走 Shunting-Yard
function evaluateGlobal(formula, rowVars, allSections) {
  if (!formula || typeof formula !== 'string') return 0
  try {
    var expanded = formula.trim()
    expanded = expandSUM(expanded, allSections || [])
    expanded = expandCellRef(expanded, allSections || [])
    return evaluate(expanded, rowVars || {})
  } catch (e) { return 0 }
}

// UI 坐标地址生成：rowIndex 为 0-based，输出 1-based
function getCellAddress(sectionKey, columnKey, rowIndex) {
  return sectionKey + '.' + columnKey + '[' + (rowIndex + 1) + ']'
}

module.exports = { evaluate, evaluateSummary, evaluateGlobal, getCellAddress }
