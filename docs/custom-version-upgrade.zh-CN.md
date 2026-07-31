# codex-mobile 定制版多机升级手册

本文用于把已经部署了公开版、旧定制版或源码版 `codex-mobile` 的电脑，统一升级到 `xus-1688/codex-mobile` 的受控定制版本。默认以 Windows 为主要部署环境，同时给出 Linux 和 Termux 的等价操作。

## 1. 发布基线

所有部署机必须使用同一个发布标识，不能只写“最新版”。

| 项目 | 约定 |
| --- | --- |
| 定制仓库 | `https://github.com/xus-1688/codex-mobile.git` |
| 稳定发布分支 | `custom/main` |
| 推荐发布标识 | 带注释标签，例如 `custom-v2026.07.30.1` |
| 最终核对依据 | 标签对应的完整 Git commit SHA |
| 生产启动入口 | `node dist-cli/index.js` |
| 当前 CLI 默认端口 | `5900`，生产环境仍应显式传入 `--port` |
| 持久数据目录 | `$CODEX_HOME`；未设置时为当前运行用户的 `~/.codex` |

发布标签必须从已经合入 `custom/main` 的干净提交创建。不要把功能分支、未提交工作区或单纯的 npm 版本号当作多机发布基线。

建议使用独立的定制标签命名空间，避免和上游已有的 `vNNN` 标签混淆：

```text
custom-vYYYY.MM.DD.N
```

其中 `N` 是当天的发布序号。

## 2. 升级原则

1. **代码和数据分离。** 应用代码放在固定部署目录，账号、会话、技能和配置继续放在原来的 `CODEX_HOME`。
2. **固定标签和 SHA。** 每台机器部署同一标签，并在完成后记录实际 SHA。
3. **不要运行 `npx codexapp` 更新定制版。** 该命令默认解析公开 npm 包，不能证明运行的是本仓库的定制代码。
4. **保持同一运行用户。** 换用户会同时改变默认 `CODEX_HOME`、项目访问权限和环境变量。
5. **保持访问源不变。** 浏览器状态和部分 UI 偏好与协议、域名及端口组成的 origin 绑定；随意改端口或域名会让它们看起来像“丢失”。
6. **先排空任务、再停服务和备份。** 不要复制仍在写入的状态文件，也不要在进行中任务或终端命令尚未结束时重启。
7. **先灰度一台。** 验证账号、会话、项目、发送消息和终端后，再分批升级其他机器。

所有部署机至少需要 Git、Node.js 18 或更高版本、pnpm，以及可用的 Codex CLI。机器还必须有权读取定制仓库；如果仓库是私有的，应提前配置 GitHub 凭据或只读 deploy key，不要把个人 token 写入仓库或升级记录。

仓库通过 `packageManager` 固定 pnpm `11.9.0`，并在 `pnpm-workspace.yaml` 中明确允许已审核依赖的构建脚本。所有部署机应使用该 pnpm 版本和兼容的 Node.js 主版本；本文创建环境使用的是 Node.js `24.14.0`。需要本地编译 `node-pty` 的机器还应预先安装对应平台的 Python 和 C/C++ 构建工具。

## 3. 必须保留的内容

升级代码时，不要删除或覆盖以下内容：

| 内容 | 默认位置或来源 | 说明 |
| --- | --- | --- |
| Codex 主数据 | `$CODEX_HOME` 或 `~/.codex` | 包含登录、`config.toml`、会话、技能、自动化、固定线程、队列、Web 登录状态等 |
| Codex Web 固定密码 | `CODEXUI_PASSWORD` 或 `CODEX_HOME/codexui-password` | 应沿用原值，避免升级后访问密码变化 |
| Telegram 配置 | 环境变量及 `CODEX_HOME/telegram-bridge.json` | 包括 token、允许用户和线程映射 |
| Skills 同步配置 | `CODEX_HOME/skills-sync.json` 及 `CODEX_HOME/skills/` | 不应放进应用源码目录 |
| Composio 数据 | 默认 `~/.composio` | 使用 Composio 时单独保留 |
| 项目目录 | 原项目路径 | 升级程序不应移动项目；服务用户必须继续有访问权限 |
| 启动配置 | Windows 服务、计划任务、systemd、tmux 脚本或环境文件 | 记录启动用户、工作目录、参数和环境变量 |
| 浏览器本地状态 | 浏览器 profile + 相同站点 origin | 服务端备份不能替代浏览器 profile |

`CODEX_HOME` 中包含认证信息。备份应留在受控本地磁盘，限制文件权限，不要上传到 Git、网盘或聊天工具。

## 4. 首次统一发布前的准备

### 4.1 发布负责人创建发布

先通过 PR 把目标改动合入 `custom/main`，再在干净工作区执行：

```powershell
function Invoke-NativeChecked {
  param([Parameter(Mandatory)] [scriptblock] $Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Native command failed with exit code $LASTEXITCODE`: $Command"
  }
}

Invoke-NativeChecked { git fetch origin --tags --prune }
Invoke-NativeChecked { git switch custom/main }
Invoke-NativeChecked { git pull --ff-only origin custom/main }
$Status = Invoke-NativeChecked { git status --short }
if ($Status) { throw 'Release checkout is not clean.' }

$LockTracked = git ls-files --error-unmatch pnpm-lock.yaml 2>$null
if ($LASTEXITCODE -eq 0) {
  Invoke-NativeChecked { pnpm install --frozen-lockfile }
} else {
  Write-Warning 'pnpm-lock.yaml is not tracked; this release is not ready for a reproducible fleet rollout.'
  Invoke-NativeChecked { pnpm install }
}
Invoke-NativeChecked { pnpm run test:unit }
Invoke-NativeChecked { pnpm run build }
Invoke-NativeChecked { node .\dist-cli\index.js --help }
```

`git status --short` 必须没有输出。测试和构建成功后再创建标签：

```powershell
$Release = 'custom-v2026.07.30.1'
Invoke-NativeChecked { git tag -a $Release -m "Custom release $Release" }
Invoke-NativeChecked { git push origin custom/main }
Invoke-NativeChecked { git push origin $Release }
$ReleaseSha = Invoke-NativeChecked { git rev-parse "$Release^{}" }
Write-Host "Release SHA: $ReleaseSha"
```

把最后输出的完整 SHA 写入发布记录，并指定上一稳定标签作为回滚目标。

### 4.2 依赖锁定门槛

多机源码构建前，先检查发布提交是否跟踪锁文件：

```powershell
git ls-files --error-unmatch pnpm-lock.yaml
```

`custom/main` 跟踪 `pnpm-lock.yaml`。部署机必须使用冻结安装，确保同一发布 SHA 解析到同一依赖图：

```powershell
pnpm install --frozen-lockfile
```

如果旧标签尚未跟踪锁文件，只能将其视为过渡版本：普通 `pnpm install` 后必须逐机完成构建和冒烟验证，并在发布记录中注明“依赖未完全锁定”。不要把部署机生成的本地锁文件当作发布依据或在机器之间手工复制。

### 4.3 发布记录最少字段

每次发布至少记录：

```text
发布标签：
完整 commit SHA：
package.json 版本：
Node.js / pnpm 版本：
pnpm-lock.yaml Git blob SHA：
验证命令及结果：
上一稳定标签或 SHA：
是否包含数据格式或配置变化：
已知问题：
```

## 5. 从公开版或 `npx` 部署迁移

如果旧机器通过 `npx codexapp`、`npm install -g codexapp` 或其他公开包启动，先不要卸载旧包。完成以下迁移并验证成功后，再决定是否清理旧包。

### 5.1 Windows 首次接入定制仓库

以下路径和标签按实际环境修改：

```powershell
$ErrorActionPreference = 'Stop'
$Repo = 'https://github.com/xus-1688/codex-mobile.git'
$AppDir = 'D:\apps\codex-mobile-custom'
$Release = 'custom-v2026.07.30.1'
$ExpectedSha = '<发布记录中的完整 SHA>'

function Invoke-NativeChecked {
  param([Parameter(Mandatory)] [scriptblock] $Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Native command failed with exit code $LASTEXITCODE`: $Command"
  }
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $AppDir) | Out-Null
Invoke-NativeChecked { git clone --origin origin $Repo $AppDir }
Set-Location $AppDir
Invoke-NativeChecked { git fetch origin --tags --prune }
$TargetSha = Invoke-NativeChecked { git rev-list -n 1 $Release }
if ($TargetSha -ne $ExpectedSha) { throw "Release SHA mismatch: $TargetSha" }
Invoke-NativeChecked { git merge-base --is-ancestor $TargetSha origin/custom/main }
Invoke-NativeChecked { git checkout --detach $Release }

$LockTracked = git ls-files --error-unmatch pnpm-lock.yaml 2>$null
if ($LASTEXITCODE -eq 0) {
  Invoke-NativeChecked { pnpm install --frozen-lockfile }
} else {
  Write-Warning 'pnpm-lock.yaml is not tracked; this build is not fully reproducible.'
  Invoke-NativeChecked { pnpm install }
}

Invoke-NativeChecked { pnpm run build }
Invoke-NativeChecked { node .\dist-cli\index.js --help }
```

然后把原启动命令从：

```powershell
npx codexapp --port 5900 --no-tunnel # 示例：这里应使用原机器的真实参数
```

改为：

```powershell
node D:\apps\codex-mobile-custom\dist-cli\index.js --port 5900 --no-tunnel # 参数必须与上一条旧命令一致
```

必须沿用原来的运行用户、`CODEX_HOME`、`CODEXUI_PASSWORD`、端口、隧道参数、登录参数、sandbox/approval 参数和 provider 配置。不要因为示例中出现了某个参数就替换原生产参数。

### 5.2 Linux / Termux 首次接入定制仓库

```bash
set -euo pipefail

REPO='https://github.com/xus-1688/codex-mobile.git'
APP_DIR="$HOME/apps/codex-mobile-custom"
RELEASE='custom-v2026.07.30.1'
EXPECTED_SHA='<发布记录中的完整 SHA>'

mkdir -p "$(dirname "$APP_DIR")"
git clone --origin origin "$REPO" "$APP_DIR"
cd "$APP_DIR"
git fetch origin --tags --prune
TARGET_SHA="$(git rev-list -n 1 "$RELEASE")"
test "$TARGET_SHA" = "$EXPECTED_SHA" || { echo "Release SHA mismatch: $TARGET_SHA" >&2; exit 1; }
git merge-base --is-ancestor "$TARGET_SHA" origin/custom/main
git checkout --detach "$RELEASE"

if git ls-files --error-unmatch pnpm-lock.yaml >/dev/null 2>&1; then
  pnpm install --frozen-lockfile
else
  echo 'WARNING: pnpm-lock.yaml is not tracked; this build is not fully reproducible.' >&2
  pnpm install
fi

pnpm run build
node ./dist-cli/index.js --help
```

把 systemd、tmux 或 Termux 启动脚本中的 `npx codexapp` 改为源码目录下的 `node .../dist-cli/index.js`，同时保留全部原环境变量和参数。

## 6. 日常升级流程

### 6.1 升级前检查

在每台部署机记录以下信息：

```powershell
node --version
pnpm --version
codex --version
git -C D:\apps\codex-mobile-custom status --short
git -C D:\apps\codex-mobile-custom rev-parse HEAD
```

升级必须满足：

- 部署仓库没有本地修改；`git status --short` 没有输出。
- 没有正在执行的 Codex turn、终端命令、导入导出或技能同步。
- 已确认目标标签、目标 SHA 和回滚 SHA。
- 已确认实际服务用户和 `CODEX_HOME`。
- 磁盘空间足够容纳备份、依赖和构建产物。

如果部署仓库有本地修改，停止升级。不要执行 `git reset --hard`、`git checkout -- .` 或用远端内容强行覆盖；先确认修改来源并单独保存或提交。

### 6.2 备份持久数据

确认任务已经排空后，先停止 codex-mobile 服务，再执行本节备份。备份完成前不要重新启动服务。`CODEX_HOME` 必须从真实服务配置或服务账号环境中抄录；也可以切换到实际服务账号后使用该账号的 `$HOME`，但不要用另一个运维账号的 home 猜测。

Windows PowerShell：

```powershell
$ErrorActionPreference = 'Stop'
$CodexHome = 'C:\Users\<实际服务账号>\.codex' # 或服务配置中的 CODEX_HOME 绝对路径
$BackupRoot = 'D:\backups\codex-mobile'
if (-not (Test-Path -LiteralPath $CodexHome -PathType Container)) {
  throw "CODEX_HOME not found: $CodexHome"
}
New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
$BackupDir = Join-Path $BackupRoot "codex-home.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item -LiteralPath $CodexHome -Destination $BackupDir -Recurse -Force
Write-Host "Backup: $BackupDir"
```

Linux / Termux：

```bash
set -euo pipefail

CODEX_HOME_PATH="${CODEX_HOME:-$HOME/.codex}" # 必须以实际服务账号执行，或改成服务配置中的绝对路径
BACKUP_ROOT="${CODEX_MOBILE_BACKUP_ROOT:-$HOME/backups/codex-mobile}"
test -d "$CODEX_HOME_PATH" || { echo "CODEX_HOME not found: $CODEX_HOME_PATH" >&2; exit 1; }
mkdir -p "$BACKUP_ROOT"
BACKUP_DIR="$BACKUP_ROOT/codex-home.$(date +%Y%m%d-%H%M%S)"
cp -a -- "$CODEX_HOME_PATH" "$BACKUP_DIR"
chmod -R go-rwx "$BACKUP_DIR"
printf 'Backup: %s\n' "$BACKUP_DIR"
```

首次迁移、跨较多版本、涉及认证/会话/配置格式时做完整备份。常规小版本也至少要确认最近一次可恢复备份仍然有效。

使用 Composio 时，以同样方式备份实际服务账号的 `~/.composio`。服务环境文件、Windows 服务/NSSM/计划任务配置或 systemd unit 应导出或截图留档，并记录真实的停止、启动和日志查看命令。浏览器 profile 通常不需要每次复制，但不能在升级过程中删除；如需备份，应先完全退出浏览器并遵循该浏览器的 profile 备份方式。

### 6.3 Windows 原地升级

下面示例假设应用目录为 `D:\apps\codex-mobile-custom`。服务停止和启动命令必须替换为当前机器真实使用的方式。

```powershell
$ErrorActionPreference = 'Stop'
$AppDir = 'D:\apps\codex-mobile-custom'
$Release = 'custom-v2026.07.30.1'
$ExpectedSha = '<发布记录中的完整 SHA>'
Set-Location $AppDir

function Invoke-NativeChecked {
  param([Parameter(Mandatory)] [scriptblock] $Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Native command failed with exit code $LASTEXITCODE`: $Command"
  }
}

$Status = Invoke-NativeChecked { git status --porcelain }
if ($Status) {
  throw 'Deployment checkout has local changes; aborting upgrade.'
}

Invoke-NativeChecked { git fetch origin --tags --prune }
$PreviousSha = Invoke-NativeChecked { git rev-parse HEAD }
$TargetSha = Invoke-NativeChecked { git rev-list -n 1 $Release }
if (-not $TargetSha) {
  throw "Release not found: $Release"
}
if ($TargetSha -ne $ExpectedSha) {
  throw "Release SHA mismatch. Expected $ExpectedSha, got $TargetSha"
}
Invoke-NativeChecked { git merge-base --is-ancestor $TargetSha origin/custom/main }

Write-Host "Previous: $PreviousSha"
Write-Host "Target:   $TargetSha"

# 在这里停止当前服务；手工前台运行时使用 Ctrl+C。
Invoke-NativeChecked { git checkout --detach $Release }

$LockTracked = git ls-files --error-unmatch pnpm-lock.yaml 2>$null
if ($LASTEXITCODE -eq 0) {
  Invoke-NativeChecked { pnpm install --frozen-lockfile }
} else {
  Write-Warning 'pnpm-lock.yaml is not tracked; using non-frozen install.'
  Invoke-NativeChecked { pnpm install }
}

Invoke-NativeChecked { pnpm run build }
Invoke-NativeChecked { node .\dist-cli\index.js --help }

# 在这里按原启动方式重新启动服务。
$ActualSha = Invoke-NativeChecked { git rev-parse HEAD }
if ($ActualSha -ne $ExpectedSha) { throw "Deployed SHA mismatch: $ActualSha" }
```

如果使用 Windows 服务，可在注释位置执行对应的 `Stop-Service` 和 `Start-Service`；如果使用计划任务、NSSM 或 PM2，应使用各自的停止和启动命令。不要同时保留旧进程和新进程抢占同一端口。

### 6.4 Linux / Termux 原地升级

```bash
set -euo pipefail

APP_DIR="$HOME/apps/codex-mobile-custom"
RELEASE='custom-v2026.07.30.1'
EXPECTED_SHA='<发布记录中的完整 SHA>'
cd "$APP_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo 'Deployment checkout has local changes; aborting upgrade.' >&2
  exit 1
fi

git fetch origin --tags --prune
PREVIOUS_SHA="$(git rev-parse HEAD)"
TARGET_SHA="$(git rev-list -n 1 "$RELEASE")"
test -n "$TARGET_SHA" || { echo "Release not found: $RELEASE" >&2; exit 1; }
test "$TARGET_SHA" = "$EXPECTED_SHA" || { echo "Release SHA mismatch: $TARGET_SHA" >&2; exit 1; }
git merge-base --is-ancestor "$TARGET_SHA" origin/custom/main

printf 'Previous: %s\nTarget:   %s\n' "$PREVIOUS_SHA" "$TARGET_SHA"

# 在这里停止 systemd、tmux 或前台服务。
git checkout --detach "$RELEASE"

if git ls-files --error-unmatch pnpm-lock.yaml >/dev/null 2>&1; then
  pnpm install --frozen-lockfile
else
  echo 'WARNING: pnpm-lock.yaml is not tracked; using non-frozen install.' >&2
  pnpm install
fi

pnpm run build
node ./dist-cli/index.js --help

# 在这里按原启动方式重新启动服务。
ACTUAL_SHA="$(git rev-parse HEAD)"
test "$ACTUAL_SHA" = "$EXPECTED_SHA" || { echo "Deployed SHA mismatch: $ACTUAL_SHA" >&2; exit 1; }
```

Termux 还要确认 wake lock、持久通知和电池优化设置没有因系统升级被重置。

## 7. 升级后验证

### 7.1 命令和进程检查

```powershell
$ErrorActionPreference = 'Stop'
$AppDir = 'D:\apps\codex-mobile-custom'
$ExpectedSha = '<发布记录中的完整 SHA>'
$Port = 5900 # 替换为单机记录中的实际端口
$ActualSha = git -C $AppDir rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or $ActualSha -ne $ExpectedSha) { throw "Unexpected SHA: $ActualSha" }
$Status = git -C $AppDir status --short
if ($LASTEXITCODE -ne 0) { throw 'Unable to read deployment checkout status.' }
if ($Status) { throw 'Deployment checkout is not clean.' }

$ListenerPids = @(Get-NetTCPConnection -LocalPort $Port -State Listen | Select-Object -ExpandProperty OwningProcess -Unique)
if ($ListenerPids.Count -ne 1) { throw "Expected one listener, found $($ListenerPids.Count)." }
$ProcessInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($ListenerPids[0])"
$ProcessInfo | Select-Object ProcessId, ExecutablePath, CommandLine
if ($ProcessInfo.CommandLine -notlike "*$AppDir*dist-cli*index.js*") {
  throw "Port $Port is not served from the expected custom checkout: $($ProcessInfo.CommandLine)"
}

(Invoke-WebRequest "http://127.0.0.1:$Port/" -UseBasicParsing).StatusCode
```

预期结果：

- SHA 与发布记录完全一致。
- 工作区仍然干净。
- 只有预期进程监听目标端口，命令行指向定制仓库的 `dist-cli/index.js`，没有遗留 `npx codexapp` 进程。
- 首页返回 HTTP 200；启用密码时，远程访问会显示登录页或要求现有会话认证。
- 启动日志没有持续重启、模块加载失败或 Codex app-server 启动失败。

Linux / Termux 可使用：

```bash
set -euo pipefail

EXPECTED_SHA='<发布记录中的完整 SHA>'
PORT='5900' # 替换为单机记录中的实际端口
git -C "$HOME/apps/codex-mobile-custom" rev-parse HEAD
test "$(git -C "$HOME/apps/codex-mobile-custom" rev-parse HEAD)" = "$EXPECTED_SHA"
test -z "$(git -C "$HOME/apps/codex-mobile-custom" status --short)"
curl -fsS -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:$PORT/"
```

Linux 上还应使用 `systemctl status <真实服务名>`、`ps`、`ss` 或 `lsof` 检查监听 PID 的完整命令行，确认它指向定制仓库而不是旧的 `npx codexapp`。Termux 使用其实际的 tmux/前台进程管理方式完成同样检查。

### 7.2 功能冒烟检查

至少检查以下项目：

- 使用原地址打开页面，浅色和深色主题都能正常显示。
- 原账号仍处于预期登录状态，provider 和 model 配置正确。
- 原项目列表、固定线程、历史会话和技能仍存在。
- 打开一个已有线程，能看到完整历史。
- 新建一条测试消息并得到回复。
- 打开集成终端，执行无副作用命令后正常关闭。
- 使用 Telegram、Composio、自动化或 Skills 同步的机器，分别验证对应功能。
- 刷新页面后再次确认状态仍然存在。

灰度机稳定运行一段观察期后，再按小批次升级其余机器。每批都记录机器名、旧 SHA、新 SHA、备份路径、开始/完成时间和验证结果。

## 8. 回滚

代码回滚优先使用升级前记录的 SHA，不要猜测“上一个标签”。

Windows：

```powershell
$ErrorActionPreference = 'Stop'
$AppDir = 'D:\apps\codex-mobile-custom'
$RollbackSha = '<升级前记录的完整 SHA>'
Set-Location $AppDir

function Invoke-NativeChecked {
  param([Parameter(Mandatory)] [scriptblock] $Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Native command failed with exit code $LASTEXITCODE`: $Command"
  }
}

# 先停止当前服务。
Invoke-NativeChecked { git checkout --detach $RollbackSha }

$LockTracked = git ls-files --error-unmatch pnpm-lock.yaml 2>$null
if ($LASTEXITCODE -eq 0) {
  Invoke-NativeChecked { pnpm install --frozen-lockfile }
} else {
  Invoke-NativeChecked { pnpm install }
}

Invoke-NativeChecked { pnpm run build }
Invoke-NativeChecked { node .\dist-cli\index.js --help }
# 按原方式启动并重新执行冒烟检查。
```

Linux / Termux：

```bash
set -euo pipefail

cd "$HOME/apps/codex-mobile-custom"
ROLLBACK_SHA='<升级前记录的完整 SHA>'

# 先停止当前服务。
git checkout --detach "$ROLLBACK_SHA"
if git ls-files --error-unmatch pnpm-lock.yaml >/dev/null 2>&1; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi
pnpm run build
node ./dist-cli/index.js --help
# 按原方式启动并重新执行冒烟检查。
```

通常只回滚代码，不立即恢复 `CODEX_HOME`，以免覆盖升级后新产生的会话。如果确认新版本已经把持久数据写成旧版本无法读取的格式，应先停止服务，保留当前故障现场副本，再恢复升级前备份。恢复数据会丢失备份时间之后的新状态，必须单独确认。

确认必须回滚数据时，不要把备份合并复制进现有目录。以下命令中的路径、服务账号和备份时间必须先按单机记录填写，并保持服务停止。

Windows：

```powershell
$ErrorActionPreference = 'Stop'
$CodexHome = 'C:\Users\<实际服务账号>\.codex'
$BackupDir = 'D:\backups\codex-mobile\codex-home.<备份时间>'
$ServiceAccount = '<实际 Windows 服务账号>'
$FailedCodexHome = "$CodexHome.failed.$(Get-Date -Format 'yyyyMMdd-HHmmss')"

if (-not (Test-Path -LiteralPath $CodexHome -PathType Container)) { throw "Current CODEX_HOME not found: $CodexHome" }
if (-not (Test-Path -LiteralPath $BackupDir -PathType Container)) { throw "Backup not found: $BackupDir" }

Move-Item -LiteralPath $CodexHome -Destination $FailedCodexHome
Copy-Item -LiteralPath $BackupDir -Destination $CodexHome -Recurse -Force

# 使用独立服务账号时，恢复其目录修改权限；管理员应先核对账号字符串。
icacls $CodexHome /grant:r "${ServiceAccount}:(OI)(CI)M" /T
if ($LASTEXITCODE -ne 0) { throw 'Failed to restore CODEX_HOME permissions.' }
Write-Host "Failed-state copy: $FailedCodexHome"
```

Linux / Termux：

```bash
set -euo pipefail

CODEX_HOME_PATH="${CODEX_HOME:-$HOME/.codex}"
BACKUP_DIR="$HOME/backups/codex-mobile/codex-home.<备份时间>"
FAILED_CODEX_HOME="${CODEX_HOME_PATH}.failed.$(date +%Y%m%d-%H%M%S)"
SERVICE_USER="$(id -un)"  # systemd 部署应改成 unit 中的 User
SERVICE_GROUP="$(id -gn)" # systemd 部署应改成 unit 中的 Group

test -d "$CODEX_HOME_PATH" || { echo "Current CODEX_HOME not found: $CODEX_HOME_PATH" >&2; exit 1; }
test -d "$BACKUP_DIR" || { echo "Backup not found: $BACKUP_DIR" >&2; exit 1; }

mv -- "$CODEX_HOME_PATH" "$FAILED_CODEX_HOME"
cp -a -- "$BACKUP_DIR" "$CODEX_HOME_PATH"
if [ "$(id -u)" -eq 0 ]; then
  chown -R "$SERVICE_USER:$SERVICE_GROUP" "$CODEX_HOME_PATH"
elif [ -z "${TERMUX_VERSION:-}" ] && [ "$(stat -c '%U' "$CODEX_HOME_PATH")" != "$SERVICE_USER" ]; then
  echo "Restored CODEX_HOME is not owned by $SERVICE_USER; rerun ownership repair as root." >&2
  exit 1
fi
chmod -R go-rwx "$CODEX_HOME_PATH"
printf 'Failed-state copy: %s\n' "$FAILED_CODEX_HOME"
```

恢复后先检查目录属主和 `config.toml`、`auth.json`、会话目录是否存在，再启动旧版并完整执行冒烟检查。只有确认回滚稳定且不再需要取证后，才能按明确路径清理 `.failed.<时间>` 目录。

## 9. 常见问题

### 页面还是旧版本

先确认服务实际进程的工作目录和命令行，再确认监听端口没有旧进程。随后对浏览器执行硬刷新。不要仅根据 `package.json` 的版本号判断，因为定制提交可能仍使用相同 npm 版本。

### 升级后账号、项目或线程消失

最常见原因是服务换了运行用户、`CODEX_HOME` 发生变化，或者浏览器访问的协议/域名/端口变化。先比较升级前后的运行用户、环境变量和 URL，不要直接覆盖数据目录。

### 构建在不同机器上结果不一致

先检查目标发布是否跟踪 `pnpm-lock.yaml`，并比较 Node.js、pnpm 版本。没有锁文件的发布不能保证依赖一致，应暂停扩大灰度范围。

### `node-pty` 或终端模块失败

先在当前依赖树中执行 `pnpm rebuild node-pty` 并重新构建。不要把删除整个共享 `node_modules` 目录作为第一步，特别是多个 worktree 共用依赖时。

### 部署目录存在本地修改

停止升级并查明修改用途。部署机不应承担功能开发；需要保留的修改应回到 Git 分支走 PR 和发布流程。禁止用强制 reset 掩盖未知修改。

## 10. 单机升级记录模板

```text
机器名：
操作系统：
部署目录：
运行用户：
CODEX_HOME：
访问 URL：
监听端口：
启动方式：
停止命令：
启动命令：
日志查看命令：
原启动参数：
升级前 SHA：
目标标签：
目标 SHA：
备份路径：
Node.js / pnpm / Codex CLI 版本：
开始时间：
完成时间：
HTTP 检查：通过 / 失败
账号与 provider：通过 / 失败
项目与历史线程：通过 / 失败
消息发送：通过 / 失败
终端：通过 / 失败
扩展功能：通过 / 失败 / 不适用
回滚目标：
备注：
```

## 11. 批量发布完成标准

只有满足以下条件，才能认为这一批机器升级完成：

- 所有机器都运行发布记录中的同一完整 SHA。
- 所有机器都使用受版本控制的同一 `pnpm-lock.yaml`、同一 Node.js 主版本和 pnpm 版本；未锁依赖的过渡版本不能标记为一致性批量发布完成。
- 所有部署仓库工作区干净。
- 所有机器使用预期的运行用户、`CODEX_HOME`、端口和启动参数。
- 灰度和每个批次都通过 HTTP 与功能冒烟检查。
- 没有重复服务、端口争用或持续重启。
- 每台机器都有可定位的备份和回滚 SHA。
- 失败机器已停止扩散，并单独记录为待处理项。
