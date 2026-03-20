export class Semaphore {
	private queue: Array<() => void> = [];
	private active = 0;

	constructor(private readonly limit: number) {}

	private acquire(): Promise<void> {
		if (this.active < this.limit) {
			this.active++;
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			this.queue.push(() => {
				this.active++;
				resolve();
			});
		});
	}

	private release(): void {
		this.active--;
		const next = this.queue.shift();
		if (next) next();
	}

	async run<T>(fn: () => Promise<T>): Promise<T> {
		await this.acquire();
		try {
			return await fn();
		} finally {
			this.release();
		}
	}
}
