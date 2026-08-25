import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExamTypeDto } from './dto/create-exam-type.dto';
import { CreateGradingSystemDto } from './dto/create-grading-system.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateExamSubjectDto } from './dto/create-exam-subject.dto';
import { EnterMarksDto } from './dto/enter-marks.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Injectable()
export class ExaminationsService {
  constructor(private prisma: PrismaService) {}

  // ─── Exam Types ───────────────────────────────────────────────

  async createExamType(organizationId: string, dto: CreateExamTypeDto) {
    const existing = await this.prisma.examType.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Exam type code '${dto.code}' already exists`);

    return this.prisma.examType.create({
      data: { organizationId, name: dto.name, code: dto.code },
    });
  }

  async findExamTypes(organizationId: string) {
    return this.prisma.examType.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async updateExamType(organizationId: string, examTypeId: string, dto: Partial<CreateExamTypeDto>) {
    const examType = await this.prisma.examType.findFirst({
      where: { id: examTypeId, organizationId },
    });
    if (!examType) throw new NotFoundException('Exam type not found');

    if (dto.code && dto.code !== examType.code) {
      const conflict = await this.prisma.examType.findUnique({
        where: { organizationId_code: { organizationId, code: dto.code } },
      });
      if (conflict) throw new ConflictException(`Exam type code '${dto.code}' already exists`);
    }

    return this.prisma.examType.update({
      where: { id: examTypeId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
      },
    });
  }

  async deleteExamType(organizationId: string, examTypeId: string) {
    const examType = await this.prisma.examType.findFirst({
      where: { id: examTypeId, organizationId },
    });
    if (!examType) throw new NotFoundException('Exam type not found');

    const inUse = await this.prisma.exam.count({ where: { examTypeId } });
    if (inUse > 0) throw new ConflictException('Exam type is used by existing exams');

    await this.prisma.examType.delete({ where: { id: examTypeId } });
  }

  // ─── Grading Systems ──────────────────────────────────────────

  async createGradingSystem(organizationId: string, dto: CreateGradingSystemDto) {
    if (dto.isDefault) {
      await this.prisma.gradingSystem.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.gradingSystem.create({
      data: {
        organizationId,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        gradeRules: {
          create: dto.gradeRules.map((r) => ({
            grade: r.grade,
            minPercentage: r.minPercentage,
            maxPercentage: r.maxPercentage,
            gradePoint: r.gradePoint ?? null,
            remark: r.remark ?? null,
          })),
        },
      },
      include: { gradeRules: { orderBy: { minPercentage: 'desc' } } },
    });
  }

  async findGradingSystems(organizationId: string) {
    return this.prisma.gradingSystem.findMany({
      where: { organizationId },
      include: { gradeRules: { orderBy: { minPercentage: 'desc' } } },
      orderBy: { isDefault: 'desc' },
    });
  }

  async findGradingSystem(organizationId: string, gradingSystemId: string) {
    const gs = await this.prisma.gradingSystem.findFirst({
      where: { id: gradingSystemId, organizationId },
      include: { gradeRules: { orderBy: { minPercentage: 'desc' } } },
    });
    if (!gs) throw new NotFoundException('Grading system not found');
    return gs;
  }

  async deleteGradingSystem(organizationId: string, gradingSystemId: string) {
    await this.findGradingSystem(organizationId, gradingSystemId);

    const inUse = await this.prisma.exam.count({ where: { gradingSystemId } });
    if (inUse > 0) throw new ConflictException('Grading system is used by existing exams');

    await this.prisma.gradingSystem.delete({ where: { id: gradingSystemId } });
  }

  // ─── Exams ────────────────────────────────────────────────────

  async createExam(organizationId: string, dto: CreateExamDto) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, organizationId },
    });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const examType = await this.prisma.examType.findFirst({
      where: { id: dto.examTypeId, organizationId },
    });
    if (!examType) throw new NotFoundException('Exam type not found');

    if (dto.gradingSystemId) {
      const gs = await this.prisma.gradingSystem.findFirst({
        where: { id: dto.gradingSystemId, organizationId },
      });
      if (!gs) throw new NotFoundException('Grading system not found');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('End date must be on or after start date');

    return this.prisma.exam.create({
      data: {
        organizationId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        examTypeId: dto.examTypeId,
        gradingSystemId: dto.gradingSystemId ?? null,
        startDate: start,
        endDate: end,
        status: 'SCHEDULED',
      },
      include: { examType: true, gradingSystem: true },
    });
  }

  async findExams(organizationId: string, filters: { academicYearId?: string; status?: string }) {
    return this.prisma.exam.findMany({
      where: {
        organizationId,
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: {
        examType: true,
        _count: { select: { examSubjects: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findExam(organizationId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, organizationId },
      include: {
        examType: true,
        gradingSystem: { include: { gradeRules: { orderBy: { minPercentage: 'desc' } } } },
        examSubjects: {
          orderBy: { examDate: 'asc' },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async updateExamStatus(organizationId: string, examId: string, status: string) {
    const exam = await this.findExam(organizationId, examId);

    const transitions: Record<string, string[]> = {
      SCHEDULED: ['ONGOING', 'CANCELLED'],
      ONGOING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!transitions[exam.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition exam from ${exam.status} to ${status}`,
      );
    }

    return this.prisma.exam.update({
      where: { id: examId },
      data: { status },
    });
  }

  async deleteExam(organizationId: string, examId: string) {
    const exam = await this.findExam(organizationId, examId);

    if (exam.status !== 'SCHEDULED') {
      throw new BadRequestException('Only SCHEDULED exams can be deleted');
    }

    await this.prisma.exam.delete({ where: { id: examId } });
  }

  // ─── Exam Subjects ────────────────────────────────────────────

  async addExamSubject(organizationId: string, examId: string, dto: CreateExamSubjectDto) {
    const exam = await this.findExam(organizationId, examId);

    if (exam.status !== 'SCHEDULED') {
      throw new BadRequestException('Can only add subjects to a SCHEDULED exam');
    }

    const cls = await this.prisma.academicClass.findFirst({
      where: { id: dto.classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    if (dto.passingMarks > dto.maxMarks) {
      throw new BadRequestException('Passing marks cannot exceed max marks');
    }

    return this.prisma.examSubject.create({
      data: {
        examId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
        startTime: dto.startTime ? this.parseTime(dto.startTime) : null,
        endTime: dto.endTime ? this.parseTime(dto.endTime) : null,
        maxMarks: dto.maxMarks,
        passingMarks: dto.passingMarks,
        weightage: dto.weightage ?? 100,
      },
    });
  }

  async deleteExamSubject(organizationId: string, examId: string, examSubjectId: string) {
    const exam = await this.findExam(organizationId, examId);

    if (exam.status !== 'SCHEDULED') {
      throw new BadRequestException('Can only remove subjects from a SCHEDULED exam');
    }

    const es = await this.prisma.examSubject.findFirst({
      where: { id: examSubjectId, examId },
    });
    if (!es) throw new NotFoundException('Exam subject not found');

    const hasMarks = await this.prisma.examMark.count({ where: { examSubjectId } });
    if (hasMarks > 0) throw new ConflictException('Cannot remove a subject that has marks entered');

    await this.prisma.examSubject.delete({ where: { id: examSubjectId } });
  }

  // ─── Marks ────────────────────────────────────────────────────

  async enterMarks(organizationId: string, examSubjectId: string, enteredBy: string, dto: EnterMarksDto) {
    const examSubject = await this.prisma.examSubject.findFirst({
      where: { id: examSubjectId, exam: { organizationId } },
      include: { exam: true },
    });
    if (!examSubject) throw new NotFoundException('Exam subject not found');

    if (examSubject.exam.status === 'CANCELLED') {
      throw new BadRequestException('Cannot enter marks for a cancelled exam');
    }

    // Validate marks don't exceed max
    for (const entry of dto.entries) {
      if (!entry.isAbsent && entry.marks !== undefined && entry.marks > Number(examSubject.maxMarks)) {
        throw new BadRequestException(
          `Marks ${entry.marks} exceed max marks ${examSubject.maxMarks} for student ${entry.studentId}`,
        );
      }
    }

    const results = await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.examMark.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId,
              studentId: entry.studentId,
            },
          },
          create: {
            examSubjectId,
            studentId: entry.studentId,
            marks: entry.isAbsent ? null : (entry.marks ?? null),
            isAbsent: entry.isAbsent ?? false,
            remarks: entry.remarks ?? null,
            enteredBy,
          },
          update: {
            marks: entry.isAbsent ? null : (entry.marks ?? null),
            isAbsent: entry.isAbsent ?? false,
            remarks: entry.remarks ?? null,
            enteredBy,
          },
        }),
      ),
    );

    return { count: results.length, examSubjectId };
  }

  async findMarks(organizationId: string, examSubjectId: string) {
    const examSubject = await this.prisma.examSubject.findFirst({
      where: { id: examSubjectId, exam: { organizationId } },
    });
    if (!examSubject) throw new NotFoundException('Exam subject not found');

    const marks = await this.prisma.examMark.findMany({
      where: { examSubjectId },
      orderBy: { studentId: 'asc' },
    });

    return { examSubject, marks };
  }

  // ─── Results ──────────────────────────────────────────────────

  async computeResults(organizationId: string, examId: string) {
    const exam = await this.findExam(organizationId, examId);

    if (exam.status !== 'COMPLETED') {
      throw new BadRequestException('Results can only be computed for COMPLETED exams');
    }

    // Get all subjects and their marks
    const examSubjects = await this.prisma.examSubject.findMany({
      where: { examId },
      include: { examMarks: true },
    });

    if (examSubjects.length === 0) {
      throw new BadRequestException('Exam has no subjects');
    }

    // Collect all unique student IDs
    const studentIds = [
      ...new Set(examSubjects.flatMap((es) => es.examMarks.map((m) => m.studentId))),
    ];

    const gradingSystem = exam.gradingSystemId
      ? await this.prisma.gradingSystem.findFirst({
          where: { id: exam.gradingSystemId },
          include: { gradeRules: true },
        })
      : null;

    const results = await this.prisma.$transaction(
      studentIds.map((studentId) => {
        let totalMarks = 0;
        let maxTotalMarks = 0;
        let allPassed = true;

        for (const es of examSubjects) {
          const mark = es.examMarks.find((m) => m.studentId === studentId);
          maxTotalMarks += Number(es.maxMarks);

          if (!mark || mark.isAbsent) {
            allPassed = false;
          } else {
            totalMarks += Number(mark.marks ?? 0);
            if (Number(mark.marks ?? 0) < Number(es.passingMarks)) {
              allPassed = false;
            }
          }
        }

        const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;

        // Find grade from grading system
        let grade: string | null = null;
        let gradePoint: number | null = null;
        if (gradingSystem) {
          const rule = [...gradingSystem.gradeRules]
            .sort((a, b) => Number(b.minPercentage) - Number(a.minPercentage))
            .find(
              (r: { minPercentage: unknown; maxPercentage: unknown; grade: string; gradePoint: unknown }) =>
                percentage >= Number(r.minPercentage) && percentage <= Number(r.maxPercentage),
            );
          grade = rule?.grade ?? null;
          gradePoint = rule?.gradePoint ? Number(rule.gradePoint) : null;
        }

        return this.prisma.examResult.upsert({
          where: { examId_studentId: { examId, studentId } },
          create: {
            examId,
            studentId,
            totalMarks,
            maxTotalMarks,
            percentage: Math.round(percentage * 100) / 100,
            grade,
            gradePoint,
            resultStatus: allPassed ? 'PASS' : 'FAIL',
          },
          update: {
            totalMarks,
            maxTotalMarks,
            percentage: Math.round(percentage * 100) / 100,
            grade,
            gradePoint,
            resultStatus: allPassed ? 'PASS' : 'FAIL',
          },
        });
      }),
    );

    return { computed: results.length, examId };
  }

  async findResults(organizationId: string, examId: string) {
    await this.findExam(organizationId, examId);

    return this.prisma.examResult.findMany({
      where: { examId },
      orderBy: { percentage: 'desc' },
    });
  }

  // ─── Homework ─────────────────────────────────────────────────

  async createHomework(organizationId: string, dto: CreateHomeworkDto) {
    const cls = await this.prisma.academicClass.findFirst({
      where: { id: dto.classId, organizationId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, academicClassId: dto.classId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, organizationId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const teacher = await this.prisma.employee.findFirst({
      where: { id: dto.teacherId, organizationId, deletedAt: null },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const assigned = new Date(dto.assignedDate);
    const due = new Date(dto.dueDate);
    if (due < assigned) throw new BadRequestException('Due date must be on or after assigned date');

    return this.prisma.homework.create({
      data: {
        organizationId,
        teacherId: dto.teacherId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        title: dto.title,
        description: dto.description ?? null,
        assignedDate: assigned,
        dueDate: due,
        maxMarks: dto.maxMarks ?? null,
        status: 'PUBLISHED',
      },
      include: { submissions: false },
    });
  }

  async findHomework(
    organizationId: string,
    filters: { classId?: string; sectionId?: string; subjectId?: string; teacherId?: string },
  ) {
    return this.prisma.homework.findMany({
      where: {
        organizationId,
        ...(filters.classId ? { classId: filters.classId } : {}),
        ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async findHomeworkById(organizationId: string, homeworkId: string) {
    const hw = await this.prisma.homework.findFirst({
      where: { id: homeworkId, organizationId },
      include: {
        submissions: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
    if (!hw) throw new NotFoundException('Homework not found');
    return hw;
  }

  async deleteHomework(organizationId: string, homeworkId: string) {
    const hw = await this.prisma.homework.findFirst({
      where: { id: homeworkId, organizationId },
    });
    if (!hw) throw new NotFoundException('Homework not found');

    await this.prisma.homework.delete({ where: { id: homeworkId } });
  }

  // ─── Homework Submissions ─────────────────────────────────────

  async submitHomework(organizationId: string, homeworkId: string, studentId: string) {
    const hw = await this.prisma.homework.findFirst({
      where: { id: homeworkId, organizationId },
    });
    if (!hw) throw new NotFoundException('Homework not found');

    const duplicate = await this.prisma.homeworkSubmission.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId } },
    });
    if (duplicate) throw new ConflictException('Student has already submitted this homework');

    return this.prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
    });
  }

  async gradeSubmission(
    organizationId: string,
    homeworkId: string,
    submissionId: string,
    dto: GradeSubmissionDto,
  ) {
    const hw = await this.prisma.homework.findFirst({
      where: { id: homeworkId, organizationId },
    });
    if (!hw) throw new NotFoundException('Homework not found');

    const submission = await this.prisma.homeworkSubmission.findFirst({
      where: { id: submissionId, homeworkId },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    if (dto.marks !== undefined && hw.maxMarks && dto.marks > Number(hw.maxMarks)) {
      throw new BadRequestException(`Marks ${dto.marks} exceed max marks ${hw.maxMarks}`);
    }

    return this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        marks: dto.marks ?? null,
        remarks: dto.remarks ?? null,
        status: 'GRADED',
      },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────

  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes, 0);
  }
}
