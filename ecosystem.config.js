module.exports = {
	apps: [
		{
			name: 'checklytool',
			script: 'node_modules/next/dist/bin/next',
			args: 'start',
			cwd: './',
			instances: 1,
			exec_mode: 'cluster',
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'production',
				PORT: 3000,
			},
			error_file: './logs/err.log',
			out_file: './logs/out.log',
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
			autorestart: true,
			max_restarts: 10,
			min_uptime: '10s',
		},
	],
}
