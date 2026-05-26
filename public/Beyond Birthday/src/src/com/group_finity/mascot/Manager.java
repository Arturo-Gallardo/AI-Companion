package com.group_finity.mascot;

import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.group_finity.mascot.config.Configuration;
import com.group_finity.mascot.exception.BehaviorInstantiationException;
import com.group_finity.mascot.exception.CantBeAliveException;

/**
 * 
 * マスコットのリストを管理し、タイミングを取るオブジェクト.
 * 
 * @author Yuki Yamada
 */
public class Manager {

	private static final Logger log = Logger.getLogger(Manager.class.getName());

	/**
	 * タイマの実行間隔.
	 */
	public static final int TICK_INTERVAL = 40;

	/**
	 * マスコットの一覧.
	 */
	private final List<Mascot> mascots = new ArrayList<Mascot>();

	/**
	 * 追加される予定のマスコットのリスト.
	 * {@link ConcurrentModificationException} を防ぐため、マスコットの追加は {@link #tick()} ごとにいっせいに反映される.
	 */
	private final Set<Mascot> added = new LinkedHashSet<Mascot>();

	/**
	 * 追加される予定のマスコットのリスト.
	 * {@link ConcurrentModificationException} を防ぐため、マスコットの削除は {@link #tick()} ごとにいっせいに反映される.
	 */
	private final Set<Mascot> removed = new LinkedHashSet<Mascot>();

	private boolean exitOnLastRemoved;
	
	private Thread thread;

	public void setExitOnLastRemoved(boolean exitOnLastRemoved) {
		this.exitOnLastRemoved = exitOnLastRemoved;
	}

	public boolean isExitOnLastRemoved() {
		return exitOnLastRemoved;
	}

	public Manager() {

		new Thread() {
			{
				this.setDaemon(true);
				this.start();
			}

			@Override
			public void run() {
				while (true) {
					try {
						Thread.sleep(Integer.MAX_VALUE);
					} catch (final InterruptedException ex) {
					}
				}
			}
		};
	}
	
	public void start() {
		if ( thread!=null && thread.isAlive() ) {
			return;
		}
		
		thread = new Thread() {
			@Override
			public void run() {

				long prev = System.nanoTime() / 1000000;
				try {
					for (;;) {
						for (;;) {
							final long cur = System.nanoTime() / 1000000;
							if (cur - prev >= TICK_INTERVAL) {
								if (cur > prev + TICK_INTERVAL * 2) {
									prev = cur;
								} else {
									prev += TICK_INTERVAL;
								}
								break;
							}
							Thread.sleep(1, 0);
						}

						tick();
					}
				} catch (final InterruptedException e) {
				}
			}
		};
		thread.setDaemon(false);
		
		thread.start();
	}
	
	public void stop() {
		if ( thread==null || !thread.isAlive() ) {
			return;
		}
		thread.interrupt();
		try {
			thread.join();
		} catch (InterruptedException e) {
		}
	}

	private void tick() {

		// まず環境情報を更新
		NativeFactory.getInstance().getEnvironment().tick();

		synchronized (this.getMascots()) {

			// 追加すべきマスコットを追加
			for (final Mascot mascot : this.getAdded()) {
				this.getMascots().add(mascot);
			}
			this.getAdded().clear();

			// 削除すべきマスコットを削除
			for (final Mascot mascot : this.getRemoved()) {
				this.getMascots().remove(mascot);
			}
			this.getRemoved().clear();

			// マスコットの時間を進める
			for (final Mascot mascot : this.getMascots()) {
				mascot.tick();
			}
			// マスコットの時間を進める
			for (final Mascot mascot : this.getMascots()) {
				mascot.apply();
			}
		}

		if (isExitOnLastRemoved()) {
			if (this.getMascots().size() == 0) {
				Main.getInstance().exit();
			}
		}
	}

	public void add(final Mascot mascot) {
		synchronized (this.getAdded()) {
			this.getAdded().add(mascot);
			this.getRemoved().remove(mascot);
		}
		mascot.setManager(this);
	}

	public void remove(final Mascot mascot) {
		synchronized (this.getAdded()) {
			this.getAdded().remove(mascot);
			this.getRemoved().add(mascot);
		}
		mascot.setManager(null);
	}

	public void setBehaviorAll(final Configuration configuration, final String name) {
		synchronized (this.getMascots()) {
			for (final Mascot mascot : this.getMascots()) {
				try {
					mascot.setBehavior(configuration.buildBehavior(name));
				} catch (final BehaviorInstantiationException e) {
					log.log(Level.SEVERE, "次の行動の初期化に失敗しました", e);
					mascot.dispose();
				} catch (final CantBeAliveException e) {
					log.log(Level.SEVERE, "行き続けることが出来ない状況", e);
					mascot.dispose();
				}
			}
		}
	}

	public void remainOne() {
		synchronized (this.getMascots()) {
			for (int i = this.getMascots().size() - 1; i > 0; --i) {
				this.getMascots().get(i).dispose();
			}
		}
	}

	public int getCount() {
		synchronized (this.getMascots()) {
			return this.getMascots().size();
		}
	}

	private List<Mascot> getMascots() {
		return this.mascots;
	}

	private Set<Mascot> getAdded() {
		return this.added;
	}

	private Set<Mascot> getRemoved() {
		return this.removed;
	}

	public void disposeAll() {
		synchronized (this.getMascots()) {
			for (int i = this.getMascots().size() - 1; i >= 0; --i) {
				this.getMascots().get(i).dispose();
			}
		}
	}
}
