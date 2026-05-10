-- 채팅방
CREATE TABLE p_chat_room (
    id                 BIGSERIAL     PRIMARY KEY,
    type               VARCHAR(20)   NOT NULL DEFAULT 'DIRECT',
    created_date       TIMESTAMP     NOT NULL,
    last_modified_date TIMESTAMP,
    deleted_date       TIMESTAMP
);

-- 채팅방 멤버
CREATE TABLE p_chat_room_member (
    id                   BIGSERIAL   PRIMARY KEY,
    room_id              BIGINT      NOT NULL REFERENCES p_chat_room(id),
    user_id              UUID        NOT NULL REFERENCES p_user(id),
    joined_at            TIMESTAMP   NOT NULL DEFAULT now(),
    last_read_message_id BIGINT,
    deleted_date         TIMESTAMP,
    CONSTRAINT uk_chat_room_member UNIQUE (room_id, user_id)
);

CREATE INDEX idx_chat_room_member_user ON p_chat_room_member (user_id, deleted_date);

-- 채팅 메시지
CREATE TABLE p_chat_message (
    id           BIGSERIAL   PRIMARY KEY,
    room_id      BIGINT      NOT NULL REFERENCES p_chat_room(id),
    sender_id    UUID        NOT NULL REFERENCES p_user(id),
    content      TEXT        NOT NULL,
    type         VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    created_date TIMESTAMP   NOT NULL DEFAULT now()
);

-- 메시지 페이징 조회 (room_id + id DESC) 용 복합 인덱스
CREATE INDEX idx_chat_message_room ON p_chat_message (room_id, id DESC);
