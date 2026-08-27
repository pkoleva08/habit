import { execFileSync } from 'node:child_process'

const portsToCheck = [4000, 5174]

function getWindowsPids(port) {
  try {
    const output = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`],
      { encoding: 'utf8' },
    )

    return [...new Set(output.split(/\s+/).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
  } catch {
    return []
  }
}

function getUnixPids(port) {
  try {
    const output = execFileSync('bash', ['-lc', `lsof -ti tcp:${port} 2>/dev/null || ss -ltnp "sport = :${port}" 2>/dev/null | awk 'NR>1 {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\\1/'`], {
      encoding: 'utf8',
    })

    return [...new Set(output.split(/\s+/).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
  } catch {
    return []
  }
}

function getPidsForPort(port) {
  return process.platform === 'win32' ? getWindowsPids(port) : getUnixPids(port)
}

function stopProcessesForPorts() {
  const pidsToStop = new Set()

  for (const port of portsToCheck) {
    const pids = getPidsForPort(port)
    for (const pid of pids) {
      if (pid !== process.ppid && pid !== process.pid) {
        pidsToStop.add(pid)
      }
    }
  }

  if (pidsToStop.size === 0) {
    return
  }

  console.log(`Cleaning up stale dev processes on ports ${portsToCheck.join(', ')}: ${[...pidsToStop].join(', ')}`)

  for (const pid of pidsToStop) {
    try {
      if (process.platform === 'win32') {
        execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`], { stdio: 'ignore' })
      } else {
        process.kill(pid, 'SIGTERM')
      }
    } catch {
      // process may already be gone; keep going
    }
  }
}

stopProcessesForPorts()
