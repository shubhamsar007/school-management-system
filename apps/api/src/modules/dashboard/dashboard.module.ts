import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { StudentModule } from '../student/student.module';
import { TeacherModule } from '../teacher/teacher.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AdmissionsModule } from '../admissions/admissions.module';
import { ExaminationsModule } from '../examinations/examinations.module';
import { SubstitutionModule } from '../substitution/substitution.module';
import { PayrollModule } from '../payroll/payroll.module';

@Module({
  imports: [StudentModule, TeacherModule, AttendanceModule, AdmissionsModule, ExaminationsModule, SubstitutionModule, PayrollModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
