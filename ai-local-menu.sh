#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_CLI="$ROOT_DIR/src/scripts/ai-local.js"

cd "$ROOT_DIR" || exit 1

clear_screen() {
  if command -v clear >/dev/null 2>&1; then
    clear
  fi
}

pause_menu() {
  printf '\nPressione ENTER para voltar ao menu...'
  read -r _
}

run_cli() {
  node "$NODE_CLI" "$@"
}

print_header() {
  printf '%s\n' '========================================'
  printf '%s\n' '        ALYA BOT - IA LOCAL OLLAMA       '
  printf '%s\n' '========================================'
}

ask_model() {
  local fallback="$1"
  local model

  printf 'Modelo [%s]: ' "$fallback"
  read -r model

  if [ -z "${model:-}" ]; then
    model="$fallback"
  fi

  printf '%s' "$model"
}

ask_prompt() {
  local prompt

  printf 'Prompt: '
  read -r prompt

  printf '%s' "$prompt"
}

confirm_action() {
  local message="$1"
  local answer

  printf '%s [s/N]: ' "$message"
  read -r answer

  case "${answer,,}" in
    s|sim|y|yes)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

show_menu() {
  print_header
  printf '\n'
  printf '1) Status do Ollama/local\n'
  printf '2) Instalar Ollama automaticamente\n'
  printf '3) Iniciar servidor Ollama\n'
  printf '4) Listar modelos instalados\n'
  printf '5) Baixar modelo\n'
  printf '6) Apagar modelo\n'
  printf '7) Testar prompt na IA local\n'
  printf '8) Preparar ambiente default\n'
  printf '9) Ajuda do CLI Node\n'
  printf '0) Sair\n'
  printf '\nEscolha: '
}

if ! command -v node >/dev/null 2>&1; then
  printf 'Erro: Node.js não encontrado no PATH.\n' >&2
  exit 1
fi

if [ ! -f "$NODE_CLI" ]; then
  printf 'Erro: CLI Node não encontrado em %s\n' "$NODE_CLI" >&2
  exit 1
fi

while true; do
  clear_screen
  show_menu
  read -r option
  printf '\n'

  case "$option" in
    1)
      run_cli status
      pause_menu
      ;;
    2)
      run_cli install
      pause_menu
      ;;
    3)
      run_cli serve
      pause_menu
      ;;
    4)
      run_cli list
      pause_menu
      ;;
    5)
      model="$(ask_model 'qwen2.5:0.5b')"
      run_cli pull "$model"
      pause_menu
      ;;
    6)
      model="$(ask_model 'qwen2.5:0.5b')"

      if confirm_action "Tem certeza que deseja apagar o modelo $model?"; then
        run_cli delete "$model"
      else
        printf 'Operação cancelada.\n'
      fi

      pause_menu
      ;;
    7)
      prompt="$(ask_prompt)"

      if [ -z "${prompt:-}" ]; then
        printf 'Prompt vazio. Nada foi enviado.\n'
      else
        run_cli run "$prompt"
      fi

      pause_menu
      ;;
    8)
      ./prepare-ai-ambiente.sh
      pause_menu
      ;;
    9)
      run_cli help
      pause_menu
      ;;
    0)
      printf 'Saindo.\n'
      exit 0
      ;;
    *)
      printf 'Opção inválida.\n'
      pause_menu
      ;;
  esac
done
