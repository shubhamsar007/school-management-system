import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubstitutionService } from './substitution.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ConfirmAssignmentDto } from './dto/confirm-assignment.dto';
import { ManualSubstitutionDto } from './dto/manual-substitution.dto';

@ApiTags('substitutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'substitutions', version: '1' })
export class SubstitutionController {
  constructor(private readonly substitutionService: SubstitutionService) {}

  // ─── Trigger ──────────────────────────────────────────────────

  @ApiOperation({
    summary:
      'Trigger substitution requests for an approved leave (runs scoring algorithm)',
  })
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  trigger(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ManualSubstitutionDto,
  ) {
    return this.substitutionService.triggerForLeaveRequest(
      user.organizationId,
      dto.leaveRequestId,
    );
  }

  // ─── Substitution Requests ────────────────────────────────────

  @ApiOperation({ summary: 'List substitution requests' })
  @ApiQuery({ name: 'status', required: false, description: 'PENDING | PARTIALLY_ASSIGNED | FULLY_ASSIGNED | CANCELLED' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'leaveRequestId', required: false })
  @Get('requests')
  findRequests(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('leaveRequestId') leaveRequestId?: string,
  ) {
    return this.substitutionService.findRequests(user.organizationId, {
      ...(status ? { status } : {}),
      ...(date ? { date } : {}),
      ...(leaveRequestId ? { leaveRequestId } : {}),
    });
  }

  @ApiOperation({ summary: 'Get a substitution request with its assignments and candidate scores' })
  @Get('requests/:id')
  findRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.findRequest(user.organizationId, id);
  }

  @ApiOperation({
    summary:
      'Get ranked candidate list for a substitution request (top qualified + disqualified with reasons)',
  })
  @Get('requests/:id/candidates')
  getRankedCandidates(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.getRankedCandidates(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Cancel a substitution request and all its pending assignments' })
  @Patch('requests/:id/cancel')
  cancelRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.cancelRequest(user.organizationId, id);
  }

  // ─── Assignments ──────────────────────────────────────────────

  @ApiOperation({
    summary:
      'Confirm a substitute teacher for a specific assignment (human approval step)',
  })
  @Patch('assignments/:id/confirm')
  confirmAssignment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ConfirmAssignmentDto,
  ) {
    return this.substitutionService.confirmAssignment(
      user.organizationId,
      id,
      dto,
      user.userId,
    );
  }

  @ApiOperation({ summary: 'Decline a confirmed assignment (substitute backs out)' })
  @Patch('assignments/:id/decline')
  declineAssignment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.substitutionService.declineAssignment(user.organizationId, id);
  }
}
