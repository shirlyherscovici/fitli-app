import React, { useState } from 'react';
import { Body, Button, Card } from './ui';
import { colors } from '../theme';
export function ConfirmDelete({ label, message, onConfirm, busy = false }: { label: string; message: string; onConfirm: () => void; busy?: boolean }) {
  const [confirm,setConfirm] = useState(false);
  return confirm ? <Card style={{ backgroundColor:colors.errorLight }}><Body>{message}</Body><Button label="Confirm delete" variant="danger" busy={busy} onPress={onConfirm} /><Button label="Cancel" variant="quiet" disabled={busy} onPress={() => setConfirm(false)} /></Card> : <Button label={label} variant="quiet" disabled={busy} onPress={() => setConfirm(true)} />;
}
