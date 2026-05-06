ALTER TABLE p_group
    ADD COLUMN join_question VARCHAR(500) NULL;

ALTER TABLE p_group_join_request
    ADD COLUMN answer VARCHAR(1000) NULL;
