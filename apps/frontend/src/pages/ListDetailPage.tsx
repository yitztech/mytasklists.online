import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { itemsApi, listsApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { AddItemForm } from '../components/AddItemForm';
import { PendingItem } from '../components/PendingItem';
import { PurchasedItem } from '../components/PurchasedItem';
import { ShareModal } from '../components/ShareModal';
import { formatSampleReceiptFromItems, getListCurrency, isAdvancedList } from '../utils/aisles';
import type { Item, ListDetail, ReceiptLineMatch } from '../types';
import { EditItemModal } from '../components/EditItemModal';

export function ListDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { show } = useToast();
  const { t } = useTranslation();

  const [list, setList] = useState<ListDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showSmartEntry, setShowSmartEntry] = useState(false);
  const [smartText, setSmartText] = useState('');
  const [listening, setListening] = useState(false);
  const [showReceiptScan, setShowReceiptScan] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [receiptMatches, setReceiptMatches] = useState<ReceiptLineMatch[] | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const reloadTimer = useRef<number | null>(null);
  const [showDates, setShowDates] = useState(() => {
    try {
      return localStorage.getItem('lc.showItemDates') === 'true';
    } catch {
      return false;
    }
  });
  const toggleDates = () =>
    setShowDates((current) => {
      try {
        localStorage.setItem('lc.showItemDates', String(!current));
      } catch {
        /* almacenamiento no disponible */
      }
      return !current;
    });

  const load = useCallback(async () => {
    try {
      const detail = await listsApi.detail(id);
      setList(detail);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detail.loadFailed'));
      setList(null);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refreshVisible = () => { if (document.visibilityState === 'visible') void load(); };
    const timer = window.setInterval(refreshVisible, 240000);
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible); };
  }, [load]);

  // Al entrar a la pantalla nos unimos a la sala de la lista
  useEffect(() => {
    if (!socket || !id) return;
    const connected = () => { void load(); };
    socket.on('connect', connected);
    socket.emit('list:join', { listId: id });
    return () => {
      socket.off('connect', connected);
      socket.emit('list:leave', { listId: id });
    };
  }, [socket, id, load]);

  /** Recarga agrupada: varios eventos seguidos provocan una sola petición */
  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(() => {
      void load();
    }, 120);
  }, [load]);

  const onListEvent = useCallback(
    (payload: { listId?: string }) => {
      if (!payload?.listId || payload.listId === id) scheduleReload();
    },
    [id, scheduleReload],
  );

  useSocketEvent('item:created', onListEvent);
  useSocketEvent('item:updated', onListEvent);
  useSocketEvent('item:purchased', onListEvent);
  useSocketEvent('item:restored', onListEvent);
  useSocketEvent('item:removed', onListEvent);
  useSocketEvent('item:reactivated', onListEvent);
  useSocketEvent('item:overdue', onListEvent);
  useSocketEvent('list:updated', onListEvent);
  useSocketEvent('list:member-added', onListEvent);
  useSocketEvent('list:member-removed', onListEvent);
  useSocketEvent('list:deleted', (payload) => {
    if (payload?.listId === id) {
      show({ title: t('detail.deletedTitle'), body: t('detail.deletedBody'), variant: 'warning' });
      navigate('/', { replace: true });
    }
  });

  const notify = (message: string, ok = true) =>
    show({ title: ok ? t('common.done') : t('common.oops'), body: message, variant: ok ? 'success' : 'danger' });

  const guard = async (action: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : failure, false);
    } finally {
      setBusy(false);
    }
  };

  // ── Acciones sobre los productos ────────────────────────────────────
  const purchase = (item: Item) =>
    guard(async () => {
      const updated = await itemsApi.purchase(item.id);
      if (updated.isRecurring && updated.nextActivationAt) {
        show({
          title: t('detail.purchasedTitle'),
          body: t('detail.purchasedBody', { name: updated.name, count: updated.recurrenceDays ?? 0 }),
          variant: 'success',
        });
      }
    }, t('detail.failures.purchase'));

  const restore = (item: Item) =>
    guard(() => itemsApi.restore(item.id), t('detail.failures.restore'));

  const close = (item: Item) =>
    guard(() => itemsApi.close(item.id), t('detail.failures.close'));

  const remove = (item: Item) =>
    guard(() => itemsApi.remove(item.id), t('detail.failures.remove'));

  const clearPurchased = () =>
    guard(() => itemsApi.clearPurchased(id), t('detail.failures.clear'));

  const advanceClock = (item: Item, days: number) =>
    guard(async () => {
      const result = await itemsApi.advanceClock(item.id, days);
      show({
        title: t('detail.clockTitle', { count: days }),
        body: t('detail.clockBody', { reactivated: result.reactivated, overdue: result.overdue }),
        variant: 'info',
      });
    }, t('detail.failures.clock'));

  const toggleNotifications = () =>
    guard(async () => {
      if (!list) return;
      await listsApi.setMyNotifications(id, !list.notifyOnChange);
    }, t('detail.failures.notify'));

  const deleteList = () =>
    guard(async () => {
      if (!window.confirm(t('detail.confirmDelete'))) return;
      await listsApi.remove(id);
      navigate('/', { replace: true });
    }, t('detail.failures.deleteList'));

  const toggleAutoSortAisles = () =>
    guard(async () => {
      if (!list) return;
      await listsApi.update(id, { autoSortAisles: !(list.autoSortAisles ?? true) });
    }, t('detail.loadFailed'));

  const toggleVoiceDictation = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const speechWin = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechCtor = speechWin.SpeechRecognition ?? speechWin.webkitSpeechRecognition;
    if (!SpeechCtor) {
      notify(t('advancedList.voiceUnsupported'), false);
      return;
    }
    const recognition = new SpeechCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) {
        setSmartText((prev) => (prev ? prev + ', ' + transcript : transcript));
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const submitSmartEntry = () =>
    guard(async () => {
      if (!smartText.trim()) return;
      const res = await itemsApi.smartEntry(id, { text: smartText.trim(), autoCreate: true });
      setSmartText('');
      setShowSmartEntry(false);
      notify(t('advancedList.smartEntryDone', { count: res.created.length }));
    }, t('addItem.failed'));

  const handleReceiptFileChange = async (file: File | null) => {
    if (!file) return;
    if (file.type.indexOf('text/') === 0) {
      const text = await file.text();
      setReceiptText(text);
      return;
    }
    if (!receiptText.trim() && list) {
      const sample = formatSampleReceiptFromItems(list.pending);
      if (sample) setReceiptText(sample);
    }
  };

  const analyzeReceipt = () =>
    guard(async () => {
      if (!receiptText.trim()) return;
      const res = await itemsApi.scanReceipt(id, receiptText.trim());
      setReceiptMatches(res.lines);
    }, t('detail.loadFailed'));

  const applyReceiptMatches = () =>
    guard(async () => {
      if (!receiptMatches) return;
      const matchesToApply = receiptMatches
        .filter((line) => line.matchedItemId !== null)
        .map((line) => ({
          itemId: line.matchedItemId!,
          paidPrice: line.price,
          suggestedRecurrenceDays: line.suggestedRecurrenceDays,
        }));
      if (matchesToApply.length === 0) return;
      const res = await itemsApi.applyReceipt(id, matchesToApply);
      setReceiptMatches(null);
      setReceiptText('');
      setShowReceiptScan(false);
      notify(t('advancedList.receiptDone', { count: res.purchasedCount }));
    }, t('detail.failures.purchase'));

  const overdueCount = useMemo(
    () => (list?.pending ?? []).filter((item) => item.isOverdue).length,
    [list],
  );

  if (error) {
    return (
      <div className="alert alert-danger" role="alert" data-testid="list-error">
        {error}
        <div className="mt-2">
          <Link className="btn btn-sm btn-outline-danger bg-white" to="/">
            {t('detail.backToLists')}
          </Link>
        </div>
      </div>
    );
  }

  if (!list || !user) return <Spinner label={t('detail.loading')} />;
  const isAdvanced = isAdvancedList(list);
  const listCurrency = getListCurrency(list);

  return (
    <div data-testid="list-detail-page" data-list-id={list.id}>
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <div className="mb-4">
        <Link
          to="/"
          className="btn btn-link text-secondary px-0 mb-2 d-inline-flex"
          style={{ minHeight: '2rem' }}
          data-testid="back-to-lists"
        >
          <i className="bi bi-arrow-left" aria-hidden="true" />
          {t('layout.lists')}
        </Link>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div
            className="d-flex align-items-center gap-3 min-w-0"
            style={{ ['--lc-list' as string]: list.color }}
          >
            <span className="lc-list-tile lc-list-tile--lg" aria-hidden="true">
              {list.icon}
            </span>
            <div className="min-w-0">
              <h1 className="lc-page-title text-truncate mb-1" data-testid="list-title">
                {list.name}
              </h1>
              <div className="d-flex flex-wrap align-items-center gap-2 text-muted">
                <span data-testid="list-counters">
                  {t('detail.counters', { pending: list.pending.length, purchased: list.purchased.length })}
                </span>
                {overdueCount > 0 && (
                  <span className="lc-chip lc-chip--late" data-testid="list-overdue-summary">
                    {t('lists.overdue', { count: overdueCount })}
                  </span>
                )}
                {list.isShared && (
                  <span className="lc-chip" data-testid="list-members-badge">
                    <i className="bi bi-people" aria-hidden="true" />
                    {t('detail.members', { count: list.memberCount })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="form-check form-switch mb-0 me-2" title={t('detail.showDatesTitle')}>
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="dates-switch"
                checked={showDates}
                onChange={toggleDates}
                data-testid="dates-switch"
              />
              <label className="form-check-label small fw-semibold" htmlFor="dates-switch">
                {t('detail.showDates')}
              </label>
            </div>

            <div className="form-check form-switch mb-0 me-2" title={t('detail.notifyTitle')}>
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="notify-switch"
                checked={list.notifyOnChange}
                onChange={toggleNotifications}
                disabled={busy}
                data-testid="notify-switch"
              />
              <label className="form-check-label small fw-semibold" htmlFor="notify-switch">
                {t('detail.notify')}
              </label>
            </div>

            <button
              className="btn btn-outline-primary"
              onClick={() => setShowShare(true)}
              data-testid="share-button"
            >
              <i className="bi bi-person-plus" aria-hidden="true" />
              {t('detail.share')}
            </button>

            {list.ownerId === user.id && (
              <button
                className="btn btn-outline-danger px-3 d-inline-flex align-items-center gap-2"
                onClick={deleteList}
                disabled={busy}
                data-testid="delete-list-button"
                aria-label={t('detail.deleteList')}
                title={t('detail.deleteList')}
              >
                <i className="bi bi-trash" aria-hidden="true" />
                <span>{t('detail.deleteList')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Calculadora Financiera y Herramientas Avanzadas ────────── */}
      {isAdvanced && (
        <div className="card mb-4 border-primary-subtle shadow-sm" data-testid="advanced-budget-card">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="lc-chip lc-chip--tag">
                  <i className="bi bi-stars me-1" aria-hidden="true" />
                  {t('advancedList.premiumBadge')}
                </span>
                <h2 className="h6 mb-0 fw-bold">{t('advancedList.budgetSummaryTitle')}</h2>
              </div>
              {list.hasHouseholdPremium && (
                <span className="lc-chip lc-chip--done" data-testid="household-premium-badge">
                  <i className="bi bi-house-heart me-1" aria-hidden="true" />
                  {t('advancedList.householdBadge')}
                </span>
              )}
            </div>

            <div className="d-flex flex-wrap gap-3 mb-3">
              <span className="lc-chip" data-testid="budget-pending-total">
                {t('advancedList.pendingTotal', {
                  amount: (list.estimatedPendingTotal ?? 0).toFixed(2),
                  currency: listCurrency,
                })}
              </span>
              <span className="lc-chip lc-chip--done" data-testid="budget-purchased-total">
                {t('advancedList.purchasedTotal', {
                  amount: (list.purchasedTotal ?? 0).toFixed(2),
                  currency: listCurrency,
                })}
              </span>
              <span className="lc-chip fw-bold" data-testid="budget-projected-total">
                {t('advancedList.projectedTotal', {
                  amount: ((list.estimatedPendingTotal ?? 0) + (list.purchasedTotal ?? 0)).toFixed(2),
                  currency: listCurrency,
                })}
              </span>
              {list.budget !== null && list.budget !== undefined && list.budget > 0 && (
                <span className="lc-chip" data-testid="budget-limit-chip">
                  {t('advancedList.budgetLimit', {
                    amount: Number(list.budget).toFixed(2),
                    currency: listCurrency,
                  })}
                </span>
              )}
            </div>

            {list.budget !== null &&
              list.budget !== undefined &&
              list.budget > 0 &&
              (list.estimatedPendingTotal ?? 0) + (list.purchasedTotal ?? 0) > Number(list.budget) && (
                <div className="alert alert-danger py-2 small mb-3" role="alert" data-testid="over-budget-alert">
                  <i className="bi bi-exclamation-octagon me-1" aria-hidden="true" />
                  {t('advancedList.overBudgetWarning')}
                </div>
              )}

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="aisles-switch"
                  checked={list.autoSortAisles ?? true}
                  onChange={toggleAutoSortAisles}
                  disabled={busy}
                  data-testid="aisles-switch"
                />
                <label className="form-check-label small fw-semibold" htmlFor="aisles-switch">
                  {t('advancedList.sortByAisles')}
                </label>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setShowSmartEntry((v) => !v);
                    setShowReceiptScan(false);
                  }}
                  data-testid="smart-entry-button"
                >
                  <i className="bi bi-mic me-1" aria-hidden="true" />
                  {t('advancedList.smartEntryBtn')}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setShowReceiptScan((v) => !v);
                    setShowSmartEntry(false);
                  }}
                  data-testid="receipt-scan-button"
                >
                  <i className="bi bi-receipt me-1" aria-hidden="true" />
                  {t('advancedList.receiptBtn')}
                </button>
              </div>
            </div>

            {showSmartEntry && (
              <div className="mt-3 pt-3 border-top" data-testid="smart-entry-panel">
                <h3 className="h6 fw-semibold mb-1">{t('advancedList.smartEntryTitle')}</h3>
                <p className="text-muted small mb-2">{t('advancedList.smartEntryHint')}</p>
                <textarea
                  className="form-control mb-2"
                  rows={2}
                  value={smartText}
                  onChange={(e) => setSmartText(e.target.value)}
                  placeholder={t('advancedList.smartEntryPlaceholder')}
                  data-testid="smart-entry-input"
                />
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={toggleVoiceDictation}
                    data-testid="smart-voice-button"
                  >
                    <i className="bi bi-mic-fill me-1" aria-hidden="true" />
                    {listening ? t('advancedList.voiceStop') : t('advancedList.voiceStart')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={busy || !smartText.trim()}
                    onClick={submitSmartEntry}
                    data-testid="smart-entry-submit"
                  >
                    {t('advancedList.smartEntrySubmit')}
                  </button>
                </div>
              </div>
            )}

            {showReceiptScan && (
              <div className="mt-3 pt-3 border-top" data-testid="receipt-scan-panel">
                <h3 className="h6 fw-semibold mb-1">{t('advancedList.receiptTitle')}</h3>
                <p className="text-muted small mb-2">{t('advancedList.receiptHint')}</p>
                <div className="mb-2">
                  <label className="form-label small" htmlFor="receipt-file">
                    {t('advancedList.receiptPhotoLabel')}
                  </label>
                  <input
                    id="receipt-file"
                    type="file"
                    className="form-control form-control-sm"
                    accept="image/*,text/plain"
                    onChange={(e) => void handleReceiptFileChange(e.target.files?.[0] ?? null)}
                    data-testid="receipt-file-input"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small" htmlFor="receipt-text">
                    {t('advancedList.receiptTextLabel')}
                  </label>
                  <textarea
                    id="receipt-text"
                    className="form-control"
                    rows={3}
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    placeholder={t('advancedList.receiptTextPlaceholder')}
                    data-testid="receipt-text-input"
                  />
                </div>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={busy || !receiptText.trim()}
                    onClick={analyzeReceipt}
                    data-testid="receipt-analyze-button"
                  >
                    {t('advancedList.receiptAnalyze')}
                  </button>
                  {receiptMatches && receiptMatches.some((m) => m.matchedItemId !== null) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      disabled={busy}
                      onClick={applyReceiptMatches}
                      data-testid="receipt-apply-button"
                    >
                      {t('advancedList.receiptApply')}
                    </button>
                  )}
                </div>

                {receiptMatches && (
                  <div className="mt-2" data-testid="receipt-matches-list">
                    {receiptMatches.filter((m) => m.matchedItemId !== null).length === 0 ? (
                      <div className="text-muted small">{t('advancedList.receiptNoMatches')}</div>
                    ) : (
                      <ul className="list-group list-group-flush small">
                        {receiptMatches
                          .filter((m) => m.matchedItemId !== null)
                          .map((match) => (
                            <li
                              key={match.rawLine}
                              className="list-group-item d-flex flex-wrap justify-content-between align-items-center px-0"
                            >
                              <span>
                                {t('advancedList.receiptMatchedTo', { name: match.matchedItemName ?? '' })}
                                {match.price !== null && ' · $' + match.price.toFixed(2)}
                              </span>
                              {match.suggestedRecurrenceDays !== null && (
                                <span className="lc-chip lc-chip--tag">
                                  {t('advancedList.receiptRecurrenceAdjust', {
                                    days: match.suggestedRecurrenceDays,
                                  })}
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Alta de productos ──────────────────────────────────────── */}
      <AddItemForm
        listId={list.id}
        isAdvanced={isAdvanced}
        disabled={busy}
        onError={(message) => notify(message, false)}
      />

      {/* ── Pendientes ─────────────────────────────────────────────── */}
      <section className="mb-5" data-testid="pending-section">
        <div className="d-flex justify-content-between align-items-center mb-2 px-1">
          <h2 className="lc-section-title">{t('detail.pendingHeading', { count: list.pending.length })}</h2>
        </div>

        {list.pending.length === 0 ? (
          <EmptyState
            icon="bi-check2-circle"
            title={t('detail.allDoneTitle')}
            description={t('detail.allDoneText')}
            testId="pending-empty"
          />
        ) : (
          <ul className="lc-items" data-testid="pending-list">
            {list.pending.map((item) => (
              <PendingItem
                key={item.id}
                item={item}
                isAdvanced={isAdvanced}
                currency={listCurrency}
                disabled={busy}
                showDates={showDates}
                onPurchase={purchase}
                onDelete={remove}
                onAdvanceClock={advanceClock}
                onEdit={setEditingItem}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ── Comprados ──────────────────────────────────────────────── */}
      {list.purchased.length > 0 && (
        <section data-testid="purchased-section">
          <div className="d-flex justify-content-between align-items-center mb-2 px-1">
            <h2 className="lc-section-title">{t('detail.purchasedHeading', { count: list.purchased.length })}</h2>
            <button
              className="btn btn-sm btn-link text-secondary"
              onClick={clearPurchased}
              disabled={busy}
              data-testid="clear-purchased"
            >
              {t('detail.clear')}
            </button>
          </div>
          <ul className="lc-items" data-testid="purchased-list">
            {list.purchased.map((item) => (
              <PurchasedItem
                key={item.id}
                item={item}
                disabled={busy}
                showDates={showDates}
                onRestore={restore}
                onClose={close}
                onEdit={setEditingItem}
              />
            ))}
          </ul>
        </section>
      )}

      {showShare && (
        <ShareModal
          list={list}
          currentUserId={user.id}
          onClose={() => setShowShare(false)}
          onChanged={load}
          onNotice={notify}
        />
      )}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          isAdvanced={isAdvanced}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            void load();
          }}
          onError={(message) => notify(message, false)}
        />
      )}
    </div>
  );
}
