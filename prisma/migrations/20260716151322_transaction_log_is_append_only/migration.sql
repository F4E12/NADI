CREATE TRIGGER transaction_log_no_update
BEFORE UPDATE ON "TransactionLog"
BEGIN
    SELECT RAISE(ABORT, 'TransactionLog is append-only: record a correcting entry instead of editing this one');
END;

CREATE TRIGGER transaction_log_no_delete
BEFORE DELETE ON "TransactionLog"
BEGIN
    SELECT RAISE(ABORT, 'TransactionLog is append-only: record a correcting entry instead of deleting this one');
END;
