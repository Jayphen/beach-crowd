
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const _VOLTA_TOOL_RECURSION: string;
	export const NIX_PROFILES: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const ABBR_TIPS_PROMPT: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const TERM_PROGRAM: string;
	export const NODE: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const TERM: string;
	export const __ETC_PROFILE_NIX_SOURCED: string;
	export const HOMEBREW_REPOSITORY: string;
	export const SSH_CLIENT: string;
	export const TMPDIR: string;
	export const npm_config_global_prefix: string;
	export const TERM_PROGRAM_VERSION: string;
	export const __ABBR_TIPS_KEYS: string;
	export const VOLTA_HOME: string;
	export const __ABBR_TIPS_VALUES: string;
	export const COLOR: string;
	export const SSH_TTY: string;
	export const npm_config_noproxy: string;
	export const PNPM_HOME: string;
	export const WORKSPACE_DIR: string;
	export const npm_config_local_prefix: string;
	export const GIT_EDITOR: string;
	export const USER: string;
	export const OPENAI_API_KEY: string;
	export const mount_authenticator_shm: string;
	export const npm_config_globalconfig: string;
	export const SSH_AUTH_SOCK: string;
	export const HOMEBREW_NO_AUTO_UPDATE: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const VIRTUAL_ENV_DISABLE_PROMPT: string;
	export const TMUX: string;
	export const CODERS_SESSION_ID: string;
	export const PATH: string;
	export const npm_config_engine_strict: string;
	export const _: string;
	export const npm_package_json: string;
	export const npm_config_init_module: string;
	export const npm_config_userconfig: string;
	export const PWD: string;
	export const npm_command: string;
	export const EDITOR: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const TMUX_PANE: string;
	export const npm_config_npm_version: string;
	export const NIX_SSL_CERT_FILE: string;
	export const npm_config_node_gyp: string;
	export const CXX: string;
	export const npm_package_version: string;
	export const GEMINI_API_KEY: string;
	export const GPG_TTY: string;
	export const DO_NOT_TRACK: string;
	export const HOME: string;
	export const SHLVL: string;
	export const ABBR_TIPS_REGEXES: string;
	export const HOMEBREW_PREFIX: string;
	export const LOGNAME: string;
	export const PYTHONPATH: string;
	export const npm_config_cache: string;
	export const npm_lifecycle_script: string;
	export const JINA_API_KEY: string;
	export const SSH_CONNECTION: string;
	export const XDG_DATA_DIRS: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const LINEAR_API_KEY: string;
	export const TMUX_PLUGIN_MANAGER_PATH: string;
	export const GOPATH: string;
	export const PKG_CONFIG_PATH: string;
	export const npm_config_user_agent: string;
	export const ACLOCAL_PATH: string;
	export const HOMEBREW_CELLAR: string;
	export const INFOPATH: string;
	export const CC: string;
	export const GI_TYPELIB_PATH: string;
	export const DISABLE_TELEMETRY: string;
	export const CLAUDECODE: string;
	export const HOMEBREW_NO_ENV_HINTS: string;
	export const COLORTERM: string;
	export const npm_config_prefix: string;
	export const npm_node_execpath: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		_VOLTA_TOOL_RECURSION: string;
		NIX_PROFILES: string;
		NoDefaultCurrentDirectoryInExePath: string;
		ABBR_TIPS_PROMPT: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		TERM_PROGRAM: string;
		NODE: string;
		INIT_CWD: string;
		SHELL: string;
		TERM: string;
		__ETC_PROFILE_NIX_SOURCED: string;
		HOMEBREW_REPOSITORY: string;
		SSH_CLIENT: string;
		TMPDIR: string;
		npm_config_global_prefix: string;
		TERM_PROGRAM_VERSION: string;
		__ABBR_TIPS_KEYS: string;
		VOLTA_HOME: string;
		__ABBR_TIPS_VALUES: string;
		COLOR: string;
		SSH_TTY: string;
		npm_config_noproxy: string;
		PNPM_HOME: string;
		WORKSPACE_DIR: string;
		npm_config_local_prefix: string;
		GIT_EDITOR: string;
		USER: string;
		OPENAI_API_KEY: string;
		mount_authenticator_shm: string;
		npm_config_globalconfig: string;
		SSH_AUTH_SOCK: string;
		HOMEBREW_NO_AUTO_UPDATE: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		VIRTUAL_ENV_DISABLE_PROMPT: string;
		TMUX: string;
		CODERS_SESSION_ID: string;
		PATH: string;
		npm_config_engine_strict: string;
		_: string;
		npm_package_json: string;
		npm_config_init_module: string;
		npm_config_userconfig: string;
		PWD: string;
		npm_command: string;
		EDITOR: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		TMUX_PANE: string;
		npm_config_npm_version: string;
		NIX_SSL_CERT_FILE: string;
		npm_config_node_gyp: string;
		CXX: string;
		npm_package_version: string;
		GEMINI_API_KEY: string;
		GPG_TTY: string;
		DO_NOT_TRACK: string;
		HOME: string;
		SHLVL: string;
		ABBR_TIPS_REGEXES: string;
		HOMEBREW_PREFIX: string;
		LOGNAME: string;
		PYTHONPATH: string;
		npm_config_cache: string;
		npm_lifecycle_script: string;
		JINA_API_KEY: string;
		SSH_CONNECTION: string;
		XDG_DATA_DIRS: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		LINEAR_API_KEY: string;
		TMUX_PLUGIN_MANAGER_PATH: string;
		GOPATH: string;
		PKG_CONFIG_PATH: string;
		npm_config_user_agent: string;
		ACLOCAL_PATH: string;
		HOMEBREW_CELLAR: string;
		INFOPATH: string;
		CC: string;
		GI_TYPELIB_PATH: string;
		DISABLE_TELEMETRY: string;
		CLAUDECODE: string;
		HOMEBREW_NO_ENV_HINTS: string;
		COLORTERM: string;
		npm_config_prefix: string;
		npm_node_execpath: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
