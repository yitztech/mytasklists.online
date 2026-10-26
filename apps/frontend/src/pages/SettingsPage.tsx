import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { usersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getSettingsTabClass,
  getInitialSettingsTab,
  isSettingsPersonal,
  isSettingsPassword,
  isSettingsLanguage,
  isSettingsPrivacy,
  SETTINGS_TAB_PERSONAL,
  SETTINGS_TAB_PASSWORD,
  SETTINGS_TAB_LANGUAGE,
  SETTINGS_TAB_PRIVACY,
  type SettingsTabId,
} from '../i18n/ui-helpers';

export function SettingsPage() {
  const { user, setUser, adoptSession, forgetSession } = useAuth();
  const { show } = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<SettingsTabId>(getInitialSettingsTab);

  // Modo edición de datos personales
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modo cambiar contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);

  // Eliminar cuenta
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setWhatsapp(user.whatsapp ?? '');
    setNotificationsEnabled(user.notificationsEnabled);
  }, [user]);

  if (!user) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = fullName.trim();
    if (trimmed.length < 2 || trimmed.length > 100 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕāēīōūĀĒĪŌŪ\s'.-]+$/.test(trimmed)) {
      show({
        title: t('settings.saveFailed'),
        body: t('register.errors.fullName'),
        variant: 'danger',
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        fullName: trimmed,
        whatsapp: whatsapp.trim(),
        notificationsEnabled,
      });
      setUser(updated);
      setIsEditingProfile(false);
      show({ title: t('settings.saved'), body: t('settings.savedBody'), variant: 'success' });
    } catch (err) {
      show({
        title: t('settings.saveFailed'),
        body: err instanceof ApiError ? err.message : t('common.tryAgain'),
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setFullName(user.fullName);
    setWhatsapp(user.whatsapp ?? '');
    setNotificationsEnabled(user.notificationsEnabled);
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setChanging(true);
    try {
      const session = await usersApi.changePassword(currentPassword, newPassword);
      adoptSession({ ...session, user: { ...session.user, hasPassword: true } });
      setCurrentPassword('');
      setNewPassword('');
      setIsChangingPassword(false);
      show({
        title: t('settings.passwordChanged'),
        body: t('settings.passwordChangedBody'),
        variant: 'success',
      });
    } catch (err) {
      show({
        title: t('settings.changeFailed'),
        body: err instanceof ApiError ? err.message : t('common.tryAgain'),
        variant: 'danger',
      });
    } finally {
      setChanging(false);
    }
  };

  const hasPassword = user.hasPassword ?? user.provider === 'local';

  const deleteAccount = async (event: FormEvent) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await usersApi.deleteAccount({
        password: hasPassword ? deletePassword : undefined,
        mfaCode: user.mfaEnabled ? deleteCode.trim() : undefined,
      });
      show({ title: t('settings.deleted'), body: t('settings.deletedBody'), variant: 'success' });
      forgetSession();
    } catch (err) {
      show({
        title: t('settings.deleteFailed'),
        body: err instanceof ApiError ? err.message : t('common.tryAgain'),
        variant: 'danger',
      });
      setDeleting(false);
    }
  };

  return (
    <div data-testid="settings-page">
      <h1 className="lc-page-title mb-4">{t('settings.title')}</h1>

      {/* Tabs de navegación */}
      <nav className="lc-tabs" role="tablist" aria-label={t('settings.title')}>
        <button
          type="button"
          role="tab"
          id="tab-personal-btn"
          aria-selected={isSettingsPersonal(activeTab)}
          aria-controls="panel-personal"
          className={getSettingsTabClass(isSettingsPersonal(activeTab))}
          onClick={() => setActiveTab(SETTINGS_TAB_PERSONAL)}
          data-testid="tab-personal"
        >
          <i className="bi bi-person" aria-hidden="true" />
          <span>{t('settings.personal')}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-password-btn"
          aria-selected={isSettingsPassword(activeTab)}
          aria-controls="panel-password"
          className={getSettingsTabClass(isSettingsPassword(activeTab))}
          onClick={() => setActiveTab(SETTINGS_TAB_PASSWORD)}
          data-testid="tab-password"
        >
          <i className="bi bi-shield-lock" aria-hidden="true" />
          <span>{t('settings.passwordTitle')}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-language-btn"
          aria-selected={isSettingsLanguage(activeTab)}
          aria-controls="panel-language"
          className={getSettingsTabClass(isSettingsLanguage(activeTab))}
          onClick={() => setActiveTab(SETTINGS_TAB_LANGUAGE)}
          data-testid="tab-language"
        >
          <i className="bi bi-translate" aria-hidden="true" />
          <span>{t('settings.languageTitle')}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-privacy-btn"
          aria-selected={isSettingsPrivacy(activeTab)}
          aria-controls="panel-privacy"
          className={getSettingsTabClass(isSettingsPrivacy(activeTab))}
          onClick={() => setActiveTab(SETTINGS_TAB_PRIVACY)}
          data-testid="tab-privacy"
        >
          <i className="bi bi-shield-check" aria-hidden="true" />
          <span>{t('legal.privacyTitle')}</span>
        </button>
      </nav>

      <div className="lc-settings-content">
        {/* Pestaña: Datos personales */}
        {isSettingsPersonal(activeTab) && (
          <div role="tabpanel" id="panel-personal" aria-labelledby="tab-personal-btn">
            <form className="card border-0 shadow-sm" onSubmit={saveProfile} data-testid="profile-form">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                  <h2 className="h5 mb-0">{t('settings.personal')}</h2>
                  {!isEditingProfile ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                      onClick={() => setIsEditingProfile(true)}
                      data-testid="profile-edit-toggle"
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                      <span>{t('item.edit')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                      onClick={cancelEditProfile}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                      <span>{t('common.cancel')}</span>
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="profile-name">
                    {t('common.fullName')}
                  </label>
                  <input
                    id="profile-name"
                    className="form-control"
                    maxLength={100}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    disabled={!isEditingProfile}
                    data-testid="profile-fullname"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="profile-email">
                    {t('common.email')}
                  </label>
                  <input id="profile-email" className="form-control" value={user.email} disabled />
                  <div className="form-text">
                    {t('settings.createdWith')} <strong>{t(`providers.${user.provider}`)}</strong>
                    {' · '}
                    {user.emailVerified ? (
                      <span className="text-success" data-testid="email-verified">
                        {t('settings.emailVerified')}
                      </span>
                    ) : (
                      <span className="text-warning-emphasis" data-testid="email-unverified">
                        {t('settings.emailUnverified')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="profile-whatsapp">
                    {t('common.whatsapp')}
                  </label>
                  <input
                    id="profile-whatsapp"
                    className="form-control"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    placeholder="+5215512345678"
                    disabled={!isEditingProfile}
                    data-testid="profile-whatsapp"
                  />
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="profile-notifications"
                    checked={notificationsEnabled}
                    onChange={(event) => setNotificationsEnabled(event.target.checked)}
                    disabled={!isEditingProfile}
                    data-testid="profile-notifications"
                  />
                  <label className="form-check-label" htmlFor="profile-notifications">
                    {t('settings.notifications')}
                  </label>
                </div>

                {isEditingProfile && (
                  <div className="d-flex gap-2 mt-4 pt-2 border-top">
                    <button className="btn btn-primary" type="submit" disabled={saving} data-testid="profile-save">
                      {saving ? t('common.saving') : t('settings.save')}
                    </button>
                    <button className="btn btn-outline-secondary" type="button" onClick={cancelEditProfile}>
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </div>
            </form>

            <div className="card border-0 shadow-sm mt-4" data-testid="delete-account-card">
              <div className="card-body p-4">
                <h2 className="h5 mb-2 text-danger">{t('settings.deleteTitle')}</h2>
                <p className="text-muted small mb-3">{t('settings.deleteHint')}</p>

                {!deleteOpen ? (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => setDeleteOpen(true)}
                    data-testid="delete-account-open"
                  >
                    {t('settings.deleteOpen')}
                  </button>
                ) : (
                  <form onSubmit={deleteAccount} data-testid="delete-account-form">
                    {hasPassword && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="delete-password">
                          {t('settings.deletePassword')}
                        </label>
                        <input
                          id="delete-password"
                          type="password"
                          className="form-control"
                          value={deletePassword}
                          onChange={(event) => setDeletePassword(event.target.value)}
                          autoComplete="current-password"
                          data-testid="delete-password"
                        />
                      </div>
                    )}
                    {user.mfaEnabled && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="delete-code">
                          {t('settings.deleteCode')}
                        </label>
                        <input
                          id="delete-code"
                          className="form-control"
                          value={deleteCode}
                          onChange={(event) => setDeleteCode(event.target.value)}
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          data-testid="delete-code"
                        />
                      </div>
                    )}
                    <div className="form-check mb-3">
                      <input
                        id="delete-confirm"
                        type="checkbox"
                        className="form-check-input"
                        checked={deleteConfirmed}
                        onChange={(event) => setDeleteConfirmed(event.target.checked)}
                        data-testid="delete-confirm"
                      />
                      <label className="form-check-label" htmlFor="delete-confirm">
                        {t('settings.deleteConfirm')}
                      </label>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="btn btn-danger"
                        disabled={
                          deleting ||
                          !deleteConfirmed ||
                          (hasPassword && !deletePassword) ||
                          (user.mfaEnabled && !deleteCode.trim())
                        }
                        data-testid="delete-account-submit"
                      >
                        {deleting ? t('settings.deleting') : t('settings.deleteSubmit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-link text-muted"
                        onClick={() => {
                          setDeleteOpen(false);
                          setDeletePassword('');
                          setDeleteCode('');
                          setDeleteConfirmed(false);
                        }}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Contraseña */}
        {isSettingsPassword(activeTab) && (
          <div role="tabpanel" id="panel-password" aria-labelledby="tab-password-btn">
            <div className="card border-0 shadow-sm" data-testid="password-card">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 mb-0">{t('settings.passwordTitle')}</h2>
                  {isChangingPassword && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                      }}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                      <span>{t('common.cancel')}</span>
                    </button>
                  )}
                </div>

                {!isChangingPassword ? (
                  <div>
                    <p className="text-muted small mb-3">{t('common.minPassword')}</p>
                    <button
                      type="button"
                      className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                      onClick={() => setIsChangingPassword(true)}
                      data-testid="password-change-toggle"
                    >
                      <i className="bi bi-key" aria-hidden="true" />
                      <span>{t('settings.changePassword')}</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={changePassword} data-testid="password-form">
                    {hasPassword && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="current-password">
                          {t('settings.currentPassword')}
                        </label>
                        <input
                          id="current-password"
                          type="password"
                          className="form-control"
                          value={currentPassword}
                          onChange={(event) => setCurrentPassword(event.target.value)}
                          autoComplete="current-password"
                          data-testid="current-password"
                          autoFocus
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label" htmlFor="new-password">
                        {t('settings.newPassword')}
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        data-testid="new-password"
                      />
                      <div className="form-text">{t('common.minPassword')}</div>
                    </div>

                    <div className="d-flex gap-2 mt-4 pt-2 border-top">
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={changing || newPassword.length < 8}
                        data-testid="password-save"
                      >
                        {changing ? t('settings.changing') : t('settings.changePassword')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                        }}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Idioma */}
        {isSettingsLanguage(activeTab) && (
          <div role="tabpanel" id="panel-language" aria-labelledby="tab-language-btn">
            <div className="card border-0 shadow-sm" data-testid="language-card">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">{t('settings.languageTitle')}</h2>
                <LanguageSwitcher />
                <div className="form-text mt-3">{t('settings.languageHint')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Privacidad y condiciones */}
        {isSettingsPrivacy(activeTab) && (
          <div role="tabpanel" id="panel-privacy" aria-labelledby="tab-privacy-btn">
            <div className="card border-0 shadow-sm" data-testid="privacy-card">
              <div className="card-body p-4">
                <h2 className="h5 mb-2">{t('legal.privacyTitle')}</h2>
                <p className="text-muted small mb-3">{t('legal.privacyHint')}</p>
                <div className="d-flex align-items-center gap-2">
                  <a href={t('legal.privacyUrl')} className="fw-semibold" data-testid="settings-privacy-link">
                    {t('legal.privacy')}
                  </a>
                  <span className="text-muted">·</span>
                  <a href={t('legal.termsUrl')} className="fw-semibold" data-testid="settings-terms-link">
                    {t('legal.terms')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
