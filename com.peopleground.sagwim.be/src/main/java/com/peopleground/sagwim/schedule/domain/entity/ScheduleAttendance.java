package com.peopleground.sagwim.schedule.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_schedule_attendance")
@Table(
    name = "p_schedule_attendance",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_schedule_attendance",
        columnNames = {"schedule_id", "user_id"}
    ),
    indexes = @Index(name = "idx_schedule_attendance_schedule_id", columnList = "schedule_id")
)
public class ScheduleAttendance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public static ScheduleAttendance of(Schedule schedule, User user) {
        ScheduleAttendance attendance = new ScheduleAttendance();
        attendance.schedule = schedule;
        attendance.user = user;
        return attendance;
    }
}
