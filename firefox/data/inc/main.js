function Erm()
{
	"use strict";

	var globalAppUrl = 'https://app.activecollab.com/';
	var globalApiUrl = 'api/v1';
	var globalACCookiePart = 'activecollab_csrf_validator_for_';

	var globalSaveTimeDiff = 10;

	var globalRequestUrl = '';
	var globalLinkUrl = '';
	var globalProjectId = 0;
	var globalPrevTaskId = 0;
	var globalTaskId = 0;
	var globalStartTime = null;
	var globalCsrfValidator = '';
	var globalJobTypes = [];
	var globalUserId = 0;
	var globalTimer = null;
	var globalContainer = null;
	var globalContainerBillable = null;
	var globalContainerJobType = null;
	var globalContainerDescription = null;
	var globalContainerTaskTitle = null;
	var globalContainerProjectTitle = null;
	var globalContainerTimeButton = null;
	var globalContainerTimeButtonLoader = null;
	var globalContainerTimeLabel = null;
	var globalContainerHandler = null;
	var globalContainerStart = null;
	var globalContainerStartButton = null;
	var globalContainerBillableStatus = null;
	var globalContainerJobTypeStatus = null;
	var globalContainerOptionsHandler = null;
	var globalContainerLoader = null;
	var globalContainerErrorButton = null;
	var globalContainerErrorMessage = null;
	var globalContainerNoticeMessage = null;
	var globalStopDrag = null;

	var globalZeroTimeLabel = '0:00:00';
	var globalAboutUrl = 'http://www.eromagency.com/actimer/';

	function InitApp(appUrl)
	{
		if(CheckLocation(appUrl))
		{
			if(GetKey())
			{
				jQuery.when(
					GetUserInfo()
				).done(function(userInfo){
					if(CheckUser(userInfo))
					{
						globalUserId = userInfo['logged_user_id'];
						globalJobTypes = userInfo['job_types'];

						var previousData = CheckPreviousData();
						if(previousData)
						{
							var taskId = parseInt(previousData.taskId);
							var taskProjectId = parseInt(previousData.taskProjectId);
							var taskTime = new Date(previousData.taskTime);
							var taskSaveTime = new Date(previousData.taskSaveTime);
							var taskBillable = parseInt(previousData.taskBillable);
							var taskJobType = parseInt(previousData.taskJobType);
							var taskDescription = previousData.taskDescription;
							var taskTitle = previousData.taskTitle;
							var projectTitle = previousData.projectTitle;

							if(previousData['action']==='save')
							{
								SaveTime(taskId, taskProjectId, taskTime, taskSaveTime, taskBillable, taskJobType, taskDescription, taskTitle, projectTitle, 'previous');
							}
							else // if(previousData['action']==='start')
							{
								jQuery.when(
									GetTaskInfo(previousData.taskProjectId, previousData.taskId),
									GetProjectInfo(previousData.taskProjectId)
								).done(function(taskInfo, projectInfo){
									if(CheckProject(projectInfo))
									{
										UpdateView(true, true);

										globalTaskId = taskId;
										globalProjectId = taskProjectId;
										
										var taskTitle = '#' + taskInfo[0]['single']['task_number'] + ': ' + taskInfo[0]['single']['name'];
										var taskUrl = taskInfo[0]['single']['url_path'];
										var projectTitle = projectInfo[0]['single']['name'];
										var projectUrl = projectInfo[0]['single']['url_path'];

										ActivateView(taskTitle, taskUrl, projectTitle, projectUrl, taskBillable, taskJobType, taskDescription);

										StartTime(taskId, taskProjectId, taskTime, taskSaveTime, taskBillable, taskJobType, taskDescription, taskTitle, projectTitle);				
									}
									else
									{
										UpdateView(true);
										DectivateView();

										var spentTime = GetSpentTime(taskSaveTime, taskTime);
										AddErrorView('Project "' + projectTitle + '" no longer allows time tracking. The timer for task "' + taskTitle + '" stoped at "' + spentTime + '". Please try to add this time manually.');
									}
								}).fail(function(jqXHR, textStatus){
									UpdateView(true);

									AddErrorView('Active Collab server is unreachable or the project "' + projectTitle + '" or task "' + taskTitle + '" no longer exists.');
								});
							}
						}
						else
						{
							UpdateView(true);
						}
					}
				}).fail(function(jqXHR, textStatus){
					// error: can't get user info -> nothing to show
				});
			}
		}
	}

	function CheckLocation(appUrl)
	{
		var customAppUrl = 0;

		if(appUrl && appUrl!==globalAppUrl)
		{
			globalAppUrl = appUrl;
			customAppUrl = 1;
		}

		if(window.location.href.indexOf(globalAppUrl) === 0)
		{
			if(customAppUrl)
			{
				globalRequestUrl = globalAppUrl + globalApiUrl;
				globalLinkUrl = globalAppUrl;
			}
			else
			{
				var instanceId = parseInt(window.location.pathname.split('/')[1]);
				globalRequestUrl = globalAppUrl + instanceId + '/' + globalApiUrl;
				globalLinkUrl = globalAppUrl + instanceId;
			}

			return true;
		}
		
		return false;
	}

	function GetKey()
	{
		var key = '';

		var items = document.cookie.split(';');
		for(var i=0; i<items.length; i++)
		{
			if(items[i].toLowerCase().indexOf(globalACCookiePart) > -1)
			{
				key = items[i].split('=').pop();
			}
		}

		globalCsrfValidator = key;
		
		return globalCsrfValidator;
	}

	function GetUserInfo()
	{
		return jQuery.ajax({
			method: 'GET',
			url: globalRequestUrl + '/user-session',
			headers: { 'X-Angie-CsrfValidator':globalCsrfValidator }
		});
	}

	function CheckUser(userInfo)
	{
		var userCan = 0;

		for(var i=0; i<userInfo['users'].length; i++)
		{
			if(userInfo['users'][i]['id']===userInfo['logged_user_id'])
			{
				if(userInfo['users'][i]['class']==='Member' || userInfo['users'][i]['class']==='Owner')
				{
					userCan = 1;
				}
				break;
			}
		}

		return userCan;
	}
	
	function UpdateView(init, previous)
	{
		if(init)
		{
			var firstTime = GetFirstTime();

			jQuery('body').append(CreateTemplate(firstTime));
			globalContainer = jQuery('#acErm');
			globalContainerBillable = jQuery('#taskBillable');
			globalContainerJobType = jQuery('#taskJobType');
			globalContainerDescription = jQuery('#taskDescription');
			globalContainerTaskTitle = jQuery('#taskTitle');
			globalContainerProjectTitle = jQuery('#projectTitle');
			globalContainerTimeButton = jQuery('#taskTimeButton');
			globalContainerTimeButtonLoader = jQuery('#taskTimeButtonLoader');
			globalContainerTimeLabel = jQuery('#taskTimeLabel');
			globalContainerHandler = jQuery('#taskHandler');
			globalContainerStart = jQuery('#acErmStart');
			globalContainerBillableStatus = jQuery('#taskBillableStatus');
			globalContainerJobTypeStatus = jQuery('#taskJobTypeStatus');
			globalContainerStartButton = jQuery('#acErmStartButton');
			globalContainerOptionsHandler = jQuery('#taskOptionsHandler');
			globalContainerLoader = jQuery('#taskLoader');
			globalContainerErrorButton = jQuery('#acErmErrorButton');
			globalContainerErrorMessage = jQuery('#acErmErrorMessage');
			globalContainerNoticeMessage = jQuery('#acErmNoticeMessage');

			var taskPositionTop = StorageGet('acErm.taskPositionTop');
			var taskPositionLeft = StorageGet('acErm.taskPositionLeft');
			if(taskPositionTop && taskPositionLeft)
			{
				taskPositionTop = parseInt(taskPositionTop);
				taskPositionLeft = parseInt(taskPositionLeft);

				var appWindow = jQuery(window);
				if(taskPositionLeft < appWindow.width() && taskPositionTop < appWindow.height())
				{
					globalContainer.css({top:taskPositionTop+'px', left:taskPositionLeft+'px'});
				}
			}

			globalContainer.draggable({
				handle: '#taskHandler',
				scroll: false,
				containment: 'window',
				stop: function( event, ui ) {
					globalStopDrag = new Date().getTime();

					StorageSet('acErm.taskPositionTop', ui.position.top);
					StorageSet('acErm.taskPositionLeft', ui.position.left);
				}
			});

			if(firstTime)
			{
				ManageFirstTime();
			}
			ManageTimeButton();
			SetBillableOptions();
			SetJobTypesOptions();
			ManageHandler();
			ManageInputs();
			ManageShowHide();
			UpdateTemplate();
			ManageError();
		}

		if(!previous)
		{
			GetCurrentTask();

			if(globalTaskId)
			{
				if(globalTaskId!==globalPrevTaskId)
				{
					if(!globalTimer)
					{
						StartTaskLoading();

						jQuery.when(
							GetTaskInfo(globalProjectId, globalTaskId),
							GetProjectInfo(globalProjectId)
						).done(function(taskInfo, projectInfo){
							var taskTitle = '#' + taskInfo[0]['single']['task_number'] + ': ' + taskInfo[0]['single']['name'];
							var taskUrl = taskInfo[0]['single']['url_path'];
							var projectTitle = projectInfo[0]['single']['name'];
							var projectUrl = projectInfo[0]['single']['url_path'];

							if(CheckProject(projectInfo))
							{
								ActivateView(taskTitle, taskUrl, projectTitle, projectUrl);
							}
							else
							{
								DectivateView();
								AddErrorView('Project "' + projectTitle + '" no longer allows time tracking.', true);
							}

							StopTaskLoading();
						}).fail(function(jqXHR, textStatus){
							StopTaskLoading();

							//AddErrorView('Active Collab server is unreachable or the project "' + projectTitle + '" or task "' + taskTitle + '" no longer exists.');
							AddErrorView('Active Collab server is unreachable or the project or task no longer exists.');
						});
					}
				}
			}
			else
			{
				if(globalTaskId!==globalPrevTaskId)
				{
					if(!globalTimer)
					{
						DectivateView();
					}
				}

				RemoveErrorView(true);
			}

			globalPrevTaskId = globalTaskId;
		}

		setTimeout(function(){
			UpdateView();
		}, 100);
	}

	function ActivateView(taskName, taskUrl, projectName, projectUrl, billableStatus, jobType, description)
	{
		globalContainer.addClass('active');
		
		SetTaskData(taskName, globalLinkUrl + taskUrl);
		SetProjectData(projectName, globalLinkUrl + projectUrl);

		if(billableStatus)
		{
			globalContainerBillable.val(billableStatus);
		}

		if(jobType)
		{
			globalContainerJobType.val(jobType);
		}

		if(description)
		{
			globalContainerDescription.val(description);
		}
	}

	function DectivateView()
	{
		globalContainer.removeClass('active');
		globalContainerDescription.val('');
		UnsetTaskData();
		UnsetProjectData();
	}

	function IsActiveView()
	{
		return globalContainer.hasClass('active');
	}

	function CheckProject(projectInfo)
	{
		return projectInfo[0]['single']['is_tracking_enabled'];
	}

	function ManageShowHide()
	{
		globalContainerOptionsHandler.on('click', function(){
			if(globalContainer.hasClass('closed'))
			{
				globalContainer.removeClass('closed');
			}
			else
			{
				globalContainer.addClass('closed');
			}
		});
	}

	function CheckTask(taskInfo, projectInfo) // HERE ???
	{
		if(taskInfo[0]['single']['is_completed'] || taskInfo[0]['single']['is_trashed'] || projectInfo[0]['single']['is_completed'] || projectInfo[0]['single']['is_trashed'])
		{
			
		}
	}

	function ManageInputs()
	{
		globalContainerBillable.on('change', function(){
			var me = jQuery(this);
			StorageSet('acErm.taskBillable', me.val());
			var status = me.find(":selected").text();
			globalContainerBillableStatus.html(status);
			if(status==='Billable')
			{
				globalContainerBillableStatus.addClass('billable');
			}
			else
			{
				globalContainerBillableStatus.removeClass('billable');
			}
		});

		globalContainerJobType.on('change', function(){
			var me = jQuery(this);
			StorageSet('acErm.taskJobType', me.val());
			globalContainerJobTypeStatus.html(me.find(":selected").text());
		});

		globalContainerDescription.on('change', function(){
			StorageSet('acErm.taskDescription', jQuery(this).val());
		}).on('input', function(){
			StorageSet('acErm.taskDescription', jQuery(this).val());
		});
	}

	function GetFirstTime()
	{
		return !StorageGet('acErm.firstTime');
	}

	function ManageFirstTime()
	{
		globalContainerStartButton.on('click', function(){
			globalContainer.removeClass('start');
			globalContainerStart.remove();
			StorageSet('acErm.firstTime', 'true');
			return false;
		});
	}

	function ManageError()
	{
		globalContainerErrorButton.on('click', function(){
			RemoveErrorView();
			return false;
		});
	}

	function SetTaskData(taskName, taskUrl)
	{
		globalContainerTaskTitle.html(taskName).attr('href', taskUrl).attr('data-task-id', globalTaskId);
	}

	function SetProjectData(projectName, projectUrl)
	{
		globalContainerProjectTitle.html(projectName).attr('href', projectUrl).attr('data-project-id', globalProjectId);
	}

	function UnsetTaskData()
	{
		globalContainerTaskTitle.html('').attr('href', '#').attr('data-task-id', '0');
	}

	function UnsetProjectData()
	{
		globalContainerProjectTitle.html('').attr('href', '#').attr('data-project-id', '0');
	}

	function StartView()
	{
		globalContainer.addClass('running');
	}

	function StopView()
	{
		globalContainerTimeLabel.html(globalZeroTimeLabel);
		globalContainer.removeClass('running');
	}

	function IsRunningView()
	{
		return globalContainer.hasClass('running');
	}

	function AddErrorView(errorText, notice)
	{
		if(!errorText)
		{
			errorText = 'Sorry, something went wrong...';
		}

		//if(!navigator.onLine)
		//{
			//errorText = 'Your browser seems to be offline.<br /><br />' + errorText;
		//}

		if(notice)
		{
			globalContainer.addClass('notice');
			globalContainerNoticeMessage.html(errorText);
		}
		else
		{
			globalContainer.addClass('error');
			globalContainerErrorMessage.html(errorText);
		}
	}

	function RemoveErrorView(notice)
	{
		if(notice)
		{
			globalContainer.removeClass('notice');
			globalContainerNoticeMessage.html('');
		}
		else
		{
			globalContainer.removeClass('error');
			globalContainerErrorMessage.html('');
		}
	}

	function StartButtonLoading()
	{
		globalContainerTimeButtonLoader.addClass('active');
	}

	function StopButtonLoading()
	{
		globalContainerTimeButtonLoader.removeClass('active');
	}

	function StartTaskLoading()
	{
		globalContainerLoader.addClass('active');
	}

	function StopTaskLoading()
	{
		globalContainerLoader.removeClass('active');
	}

	function UpdateTemplate()
	{
		var status = globalContainerBillable.find(":selected").text();
		globalContainerBillableStatus.html(status);
		if(status==='Billable')
		{
			globalContainerBillableStatus.addClass('billable');
		}
		else
		{
			globalContainerBillableStatus.removeClass('billable');
		}

		globalContainerJobTypeStatus.html(globalContainerJobType.find(":selected").text());
	}

	function CreateTemplate(firstTime)
	{
		var template = '';
		
		template += '<div id="acErm" class="closed' + (firstTime ? ' start' : '') + '">';
			if (firstTime)
			{
				template += '<div id="acErmStart">';
					template += '<div id="acErmStartDesc">Welcome to the Timer for Active Collab - a Chrome browser extension.</div>';
					template += '<div id="acErmStartHowTo">How to use it:</div>';
					template += '<div id="acErmStartDrag"><div id="acErmStartDragIcon"></div>Drag to reposition timer</div>';
					template += '<div id="acErmStartClick"><div id="acErmStartClickIcon"></div>Click to show and hide the timer details</div>';
					template += '<div id="acErmStartButtonWrapper">';
						template += '<button type="button" id="acErmStartButton" class="acErmButton"></button>';
					template += '</div>';
				template += '</div>';
			}

			template += '<div id="acErmError">';
				template += '<div id="acErmErrorMessage"></div>';
				template += '<div id="acErmErrorButtonWrapper">';
					template += '<button type="button" id="acErmErrorButton" class="acErmButton"></button>';
				template += '</div>';
			template += '</div>';
			
			template += '<div id="acErmInner">';

				template += '<div id="acErmNotice">';
					template += '<div id="acErmNoticeMessage"></div>';
				template += '</div>';

				template += '<div id="taskHead">';
					template += '<div id="taskNoneSelected">Please enter a task in order to activate the timer and to be able to track time.</div>';
					template += '<div id="taskSelected">';
						template += '<div id="taskTitleWrapper">';
							template += '<span id="taskTitleLabel">Task</span>';
							template += '<a href="#" id="taskTitle"></a>';
						template += '</div>';
						template += '<div id="projectTitleWrapper">';
							template += '<span id="projectTitleLabel">Project</span>';
							template += '<a href="#" id="projectTitle"></a>';
						template += '</div>';
					template += '</div>';
					template += '<div id="taskOptionsStatus" class="">';
						template += '<div id="taskBillableStatus"></div>';
						template += '<div id="taskJobTypeStatus"></div>';
						template += '<div class="clear"></div>';
					template += '</div>';
				template += '</div>';

				template += '<div id="taskOptions">';
					
					template += '<div id="taskBillableWrapper">';
						template += '<label id="taskBillableLabel" for="taskBillable" class="taskOptionsLabel">State</label>';
						template += '<select id="taskBillable" class="taskOptionsSelect"></select>';
					template += '</div>';
				
					template += '<div id="taskJobTypeWrapper">';
						template += '<label id="taskJobTypeLabel" for="taskJobType" class="taskOptionsLabel">Job type</label>';
						template += '<select id="taskJobType" class="taskOptionsSelect"></select>';
					template += '</div>';
				
					template += '<div id="taskDescriptionWrapper">';
						template += '<textarea id="taskDescription" placeholder="Description"></textarea>';
					template += '</div>';
					
				template += '</div>';
				
				template += '<div id="taskTime">';
					template += '<button type="button" id="taskTimeButton" class="acErmButton">';
						template += '<div id="taskTimeButtonLoader" class="loader">';
							template += '<div class="loaderRect rect1"></div>';
							template += '<div class="loaderRect rect2"></div>';
							template += '<div class="loaderRect rect3"></div>';
						template += '</div>';
					template += '</button>';
					template += '<div id="taskTimeLabel">' + globalZeroTimeLabel + '</div>';
					template += '<div class="clear"></div>';
				template += '</div>';

				template += '<div id="taskOptionsHandler">';
					template += '<div id="taskOptionsHandlerIcon">&raquo;</div>';
					template += '<div id="taskOptionsHandlerIconMore"></div>';
				template += '</div>';

				template += '<a href="' + globalAboutUrl + '" target="_blank" id="taskAbout">';
					template += '<span id="taskAboutMore">Click for details</span>';
					template += 'i';
				template += '</a>';

				template += '<div id="taskLoader">';
					template += '<div id="taskLoaderContainer" class="loader">';
						template += '<div class="loaderRect rect1"></div>';
						template += '<div class="loaderRect rect2"></div>';
						template += '<div class="loaderRect rect3"></div>';
					template += '</div>';
				template += '</div>';
			
			template += '</div>';

			template += '<div id="taskHandler">';
				template += '<div id="taskHandlerHandContainer">';
					template += '<div id="taskHandlerHand"></div>';
				template += '</div>';
			template += '</div>';

		template += '</div>';

		return template;
	}

	function ManageTimeButton()
	{
		globalContainerTimeButton.on('click', function(){
			if(IsActiveView())
			{
				if(IsRunningView())
				{
					StopTime();
				}
				else
				{
					var taskId = globalTaskId;
					var taskProjectId = globalProjectId;
					var taskTime = new Date();
					var taskSaveTime = new Date();
					var taskBillable = globalContainerBillable.val();
					var taskJobType = globalContainerJobType.val();
					var taskDescription = globalContainerDescription.val();
					var taskTitle = globalContainerTaskTitle.html();
					var projectTitle = globalContainerProjectTitle.html();

					StartTime(taskId, taskProjectId, taskTime, taskSaveTime, taskBillable, taskJobType, taskDescription, taskTitle, projectTitle);
				}
			}
		});

		globalContainerTimeButtonLoader.on('click', function(){
			return false;
		});
	}

	function GetTaskBillable()
	{
		var prevBillable = StorageGet('acErm.taskBillable');
		var billable = 0;

		if(prevBillable==='0' || prevBillable==='1')
		{
			billable = parseInt(prevBillable);
		}
		else
		{
			billable = 1;
		}

		return billable;
	}

	function SetBillableOptions()
	{
		var selectedId = GetTaskBillable();

		var options = '';
		options += '<option value="1"' + (selectedId === 1 ? ' selected="selected"' : '') + '>Billable</option>';
		options += '<option value="0"' + (selectedId === 0 ? ' selected="selected"' : '') + '>Not billable</option>';

		globalContainerBillable.html(options);
	}

	function GetTaskJobTypes()
	{
		var prevJobType = parseInt(StorageGet('acErm.taskJobType'));
		var jobType = 0;
		var i = 0;
		
		for(i=0; i<globalJobTypes.length; i++)
		{
			var jobTypeId = parseInt(globalJobTypes[i]['id']);
			if(prevJobType === jobTypeId)
			{
				jobType = jobTypeId;
			}
		}
		if(!jobType)
		{
			for(i=0; i<globalJobTypes.length; i++)
			{
				var jobTypeId = parseInt(globalJobTypes[i]['id']);
				if(globalJobTypes[i]['is_default'])
				{
					jobType = jobTypeId;
				}
			}
		}

		return jobType;
	}

	function SetJobTypesOptions()
	{
		var selectedId = GetTaskJobTypes();

		var options = '';

		for(var i=0; i<globalJobTypes.length; i++)
		{
			options += '<option value="'+ globalJobTypes[i]['id'] +'"';
			if(selectedId === parseInt(globalJobTypes[i]['id']))
			{
				options += ' selected="selected"';
			}
			options += '>'+ globalJobTypes[i]['name'] +'</option>';
		}
		
		globalContainerJobType.html(options);
	}

	function ManageHandler()
	{
		globalContainerHandler.on('click', function(){
			if(!globalStopDrag || new Date().getTime() - globalStopDrag > 300)
			{
				globalContainer.toggleClass('hidden');
			}
		});
	}

	function GetTaskInfo(projectId, taskId)
	{
		return jQuery.ajax({
			method: 'GET',
			url: globalRequestUrl + '/projects/' + projectId + '/tasks/' + taskId,
			headers: { 'X-Angie-CsrfValidator':globalCsrfValidator }
		});
	}

	function GetProjectInfo(projectId)
	{
		return jQuery.ajax({
			method: 'GET',
			url: globalRequestUrl + '/projects/' + projectId,
			headers: { 'X-Angie-CsrfValidator':globalCsrfValidator }
		});
	}

	function GetCurrentTask()
	{
		var taskId = 0;
		var projectId = 0;

		var needle1 = 'modal=Task-';
		var pos1 = window.location.href.indexOf(needle1);
		if(pos1 > -1)
		{
			var tmp = window.location.href.substr(pos1 + needle1.length).split('-');
			taskId = parseInt(tmp.shift());
			projectId = parseInt(tmp.pop());
		}
		else
		{
			var needle2 = '/tasks/';
			var pos2 = window.location.href.indexOf(needle2);
			if(pos2 > -1)
			{
				taskId = parseInt(window.location.href.substr(pos2 + needle2.length).split('?').shift());

				var needle3 = '/projects/';
				var pos3 = window.location.href.indexOf(needle3);
				if(pos3 > -1)
				{
					projectId = parseInt(window.location.href.substr(pos3 + needle3.length, pos2 - pos3 + needle3.length));
				}
			}
		}

		globalTaskId = taskId;
		globalProjectId = projectId;
	}

	function StartTime(taskId, taskProjectId, taskTime, taskSaveTime, taskBillable, taskJobType, taskDescription, taskTitle, projectTitle)
	{
		StorageSet('acErm.taskId', taskId);
		StorageSet('acErm.taskProjectId', taskProjectId);
		StorageSet('acErm.taskTime', taskTime);
		StorageSet('acErm.taskSaveTime', taskSaveTime);
		StorageSet('acErm.taskBillable', taskBillable);
		StorageSet('acErm.taskJobType', taskJobType);
		StorageSet('acErm.taskDescription', taskDescription);
		StorageSet('acErm.taskTitle', taskTitle);
		StorageSet('acErm.projectTitle', projectTitle);
		StorageSet('acErm.taskUserId', globalUserId);
		StorageSet('acErm.taskFinished', '0');

		globalStartTime = taskTime;
		StartView();

		UpdateTime();
	}

	function StopTime()
	{
		StartButtonLoading();

		var taskId = parseInt(globalContainerTaskTitle.attr('data-task-id'));
		var taskProjectId = parseInt(globalContainerProjectTitle.attr('data-project-id'));
		var taskTime = globalStartTime;
		var taskSaveTime = new Date();
		var taskBillable = parseInt(globalContainerBillable.val());
		var taskJobType = parseInt(globalContainerJobType.val());
		var taskDescription = globalContainerDescription.val();
		var taskTitle = globalContainerTaskTitle.html();
		var projectTitle = globalContainerProjectTitle.html();

		SaveTime(taskId, taskProjectId, taskTime, taskSaveTime, taskBillable, taskJobType, taskDescription, taskTitle, projectTitle, 'current');
	}
	
	function SaveTime(taskId, taskProjectId, taskTime, taskSaveTime, taskBillable, taskJobType, taskDescription, taskTitle, projectTitle, action)
	{
		var spentTime = GetSpentTime(taskSaveTime, taskTime);

		jQuery.when(
			GetTaskInfo(taskProjectId, taskId),
			GetProjectInfo(taskProjectId)
		).done(function(taskInfo, projectInfo){
			if(action==='current')
			{
				clearTimeout(globalTimer);
				globalTimer = null;
				globalStartTime = null;
			}

			var recordDate = new Date();
			if(action==='previous')
			{
				recordDate = taskSaveTime;
			}
			var recordDateStr = recordDate.getFullYear() + '-' + (recordDate.getMonth() + 1) + '-' + recordDate.getDate();

			jQuery.when(
				SetTimeInfo(taskId, taskProjectId, taskBillable, taskJobType, recordDateStr, taskDescription, spentTime)
			).done(function( msg ) {

				StorageSet('acErm.taskFinished', '1');

				if(action==='current')
				{
					StopView();

					RemoveErrorView(true);

					if(globalTaskId)
					{
						if(globalTaskId===taskId)
						{
							UpdateTaskTimeLabel(spentTime, taskProjectId, taskId);
						}
						else
						{
							StartTaskLoading();

							jQuery.when(
								GetTaskInfo(globalProjectId, globalTaskId),
								GetProjectInfo(globalProjectId)
							).done(function(taskInfo, projectInfo){
								var taskName = '#' + taskInfo[0]['single']['task_number'] + ': ' + taskInfo[0]['single']['name'];
								var taskUrl = taskInfo[0]['single']['url_path'];
								var projectName = projectInfo[0]['single']['name'];
								var projectUrl = projectInfo[0]['single']['url_path'];

								if(CheckProject(projectInfo))
								{
									ActivateView(taskName, taskUrl, projectName, projectUrl);
								}
								else
								{
									DectivateView();
									AddErrorView('Project "' + projectName + '" no longer allows time tracking.', true);
								}

								StopTaskLoading();
							}).fail(function(jqXHR, textStatus){
								StopTaskLoading();

								//AddErrorView('Active Collab server is unreachable or the project "' + projectTitle + '" or task "' + taskTitle + '" no longer exists.');
								AddErrorView('Active Collab server is unreachable or the project or task no longer exists.');
							});
						}	
					}
					else
					{
						DectivateView();
					}

					StopButtonLoading();
				}
				else // if(action==='previous')
				{
					UpdateView(true);

					AddErrorView('Your browser quited unexpectedly while the timer was recording. To make sure you don’t loose the unsaved time, we just saved the "' + spentTime + '" recorded in task "' + taskTitle + '" in project "' + projectTitle + '" with the date when the browser closed.');
				}
			}).fail(function(jqXHR, textStatus) {
				if(action==='current')
				{
					StopButtonLoading();

					AddErrorView('Can\'t save the "' + spentTime + '" time recorded on task "' + taskTitle + '" in project "' + projectTitle + '". Please try to add it manually.');
				}
				else // if(action==='previous')
				{
					UpdateView(true);

					AddErrorView('Unsaved time detected. Can\'t save the "' + spentTime + '" time recorded on task "' + taskTitle + '" in project "' + projectTitle + '". Please try to add it manually.');
				}
			});
		}).fail(function(jqXHR, textStatus, errorThrown){
			if(action==='current')
			{
				StopButtonLoading();

				AddErrorView('Active Collab server is unreachable or the project "' + projectTitle + '" or task "' + taskTitle + '" no longer exists. Please try to add the "' + spentTime + '" time manually.');
				
				console.log(jqXHR);
				console.log(textStatus);
				console.log(errorThrown);
			}
			else // if(action==='previous')
			{
				UpdateView(true);

				AddErrorView('Active Collab server is unreachable or the project "' + projectTitle + '" or task "' + taskTitle + '" no longer exists. Please try to add the "' + spentTime + '" time manually.');
			}
		});
	}

	function GetSpentTime(taskSaveTime, taskTime)
	{
		var elapsedMinutes = Math.ceil((taskSaveTime.getTime() - taskTime.getTime()) / (60 * 1000));
		return GetTimeFromMinutes(elapsedMinutes);
	}

	function SetTimeInfo(taskId, taskProjectId, taskBillable, taskJobType, recordDateStr, taskDescription, spentTime)
	{
		return jQuery.ajax({
			method: 'POST',
			url: globalRequestUrl + '/projects/' + taskProjectId + '/time-records',
			data: 'billable_status=' + taskBillable + '&job_type_id=' + taskJobType + '&record_date=' + recordDateStr + '&summary=' + encodeURIComponent(taskDescription) + '&task_id=' + taskId + '&user_id=' + globalUserId + '&value=' + spentTime,
			headers: { 'X-Angie-CsrfValidator':globalCsrfValidator }
		});
	}

	function UpdateTaskTimeLabel(spentTime, taskProjectId, taskId)
	{
		var amount = jQuery('.task_time_and_expenses_block').eq(0).find('.amount');
		if(amount)
		{
			var oldValue = amount.html().split(':');
			var oldMinutes = parseInt(oldValue[0]) * 60 + parseInt(oldValue[1]);

			var currValue = spentTime.split(':');
			var currMinutes = parseInt(currValue[0]) * 60 + parseInt(currValue[1]);

			var newMinutes = oldMinutes + currMinutes;
			var newValue = GetTimeFromMinutes(newMinutes);
			
			amount.html(newValue);

			GetTaskInfo(taskProjectId, taskId);
			GetProjectInfo(taskProjectId);
		}
	}

	function GetTimeFromMinutes(elapsedMinutes)
	{
		var hours   = Math.floor(elapsedMinutes / 60);
		var minutes = elapsedMinutes - (hours * 60);

		if (minutes < 10)
		{
			minutes = "0"+minutes;
		}

		return hours+':'+minutes;
	}

	function UpdateTime()
	{
		var taskFinished = StorageGet('acErm.taskFinished');
		
		if(taskFinished==='0' || !taskFinished)
		{
			// HERE - OPTIONAL - if StorageGet('acErm.xxx') is null -> recreate based on running task

			var elapsedSeconds = Math.floor((new Date() - globalStartTime)/1000);
			var elapsedTime = GetTimeFromSeconds(elapsedSeconds);
			globalContainerTimeLabel.html(elapsedTime);

			StorageSet('acErm.taskSaveTime', new Date());

			globalTimer = setTimeout(function(){
				UpdateTime();
			}, 1000);
		}
		
		if(taskFinished==='1')
		{
			clearTimeout(globalTimer);
			globalTimer = null;
			globalStartTime = null;
			
			StopView();

			var storredTaskId = StorageGet('acErm.taskId');
			if(storredTaskId)
			{
				var taskId = parseInt(storredTaskId);

				if(globalTaskId===taskId)
				{
					var storredTaskProjectId = StorageGet('acErm.taskProjectId');
					var storredTaskTime = StorageGet('acErm.taskTime');
					var storredTaskSaveTime = StorageGet('acErm.taskSaveTime');

					if(storredTaskProjectId && storredTaskTime && storredTaskSaveTime)
					{
						var taskProjectId = parseInt(storredTaskProjectId);	
						var taskTime = new Date(storredTaskTime);
						var taskSaveTime = new Date(storredTaskSaveTime);

						var spentTime = GetSpentTime(taskSaveTime, taskTime);
						UpdateTaskTimeLabel(spentTime, taskProjectId, taskId);
					}
				}
			}
		}
	}

	function GetTimeFromSeconds(elapsedSeconds)
	{
		var hours   = Math.floor(elapsedSeconds / 3600);
		var minutes = Math.floor((elapsedSeconds - (hours * 3600)) / 60);
		var seconds = elapsedSeconds - (hours * 3600) - (minutes * 60);

		if (minutes < 10)
		{
			minutes = '0' + minutes;
		}
		if (seconds < 10)
		{
			seconds = '0' + seconds;
		}

		return hours+':'+minutes+':'+seconds;
	}

	function CheckPreviousData()
	{
		var status = null;
		var taskFinished = StorageGet('acErm.taskFinished');

		if(taskFinished==='0')
		{
			var taskUserId = parseInt(StorageGet('acErm.taskUserId'));
			if(globalUserId===taskUserId)
			{
				var storredTaskId = StorageGet('acErm.taskId');
				var storredTaskProjectId = StorageGet('acErm.taskProjectId');
				var storredTaskTime = StorageGet('acErm.taskTime');
				var storredTaskBillable = StorageGet('acErm.taskBillable');
				var storredTaskJobType = StorageGet('acErm.taskJobType');
				var storredTaskDescription = StorageGet('acErm.taskDescription');
				var storredTaskSaveTime = StorageGet('acErm.taskSaveTime');
				var storredTaskTitle = StorageGet('acErm.taskTitle');
				var storredProjectTitle = StorageGet('acErm.projectTitle');
				
				if(storredTaskId && storredTaskProjectId && storredTaskTime && storredTaskSaveTime)
				{
					var taskId = parseInt(storredTaskId);
					var taskProjectId = parseInt(storredTaskProjectId);
					var taskTime = new Date(storredTaskTime);
					var taskBillable = parseInt(storredTaskBillable);
					var taskJobType = GetJobType(parseInt(storredTaskJobType));
					var taskDescription = storredTaskDescription;
					var taskSaveTime = new Date(storredTaskSaveTime);
					var taskTitle = storredTaskTitle;
					var projectTitle = storredProjectTitle;
					
					status = {
						taskId:taskId, 
						taskProjectId:taskProjectId, 
						taskTime:taskTime, 
						taskBillable:taskBillable, 
						taskJobType:taskJobType, 
						taskDescription:taskDescription, 
						taskSaveTime:taskSaveTime, 
						taskTitle:taskTitle, 
						projectTitle:projectTitle
					};

					if(new Date().getTime() - taskSaveTime.getTime() > globalSaveTimeDiff * 1000)
					{
						status.action = 'save';
					}
					else
					{
						status.action = 'start';
					}
				}
			}
			else
			{
				StorageSet('acErm.taskId', '');
				StorageSet('acErm.taskProjectId', '');
				StorageSet('acErm.taskTime', '');
				StorageSet('acErm.taskSaveTime', '');
				StorageSet('acErm.taskDescription', '');
				StorageSet('acErm.taskUserId', '');
				StorageSet('acErm.taskTitle', '');
				StorageSet('acErm.projectTitle', '');

				StorageSet('acErm.taskFinished', '1');
			}
		}

		return status;
	}

	function GetJobType(id)
	{
		var defaultJobType = 0;
		var found = 0;

		for(var i=0; i<globalJobTypes.length; i++)
		{
			if(globalJobTypes[i]['is_default'])
			{
				defaultJobType = globalJobTypes[i]['id'];
			}
			if(id && parseInt(globalJobTypes[i]['id'])===parseInt(id))
			{
				found = id;
			}
		}

		return found ? found : defaultJobType;
	}

	function StorageGet(key) // https://github.com/mathiasbynens/he
	{
		//return localStorage.getItem(key);
		return GetCookie(key);
	}

	function StorageSet(key, val)
	{
		//localStorage.setItem(key, val);
		SetCookie(key, val, 30);
	}

	// function StorageRemove(key)
	// {
	// 	localStorage.removeItem(key);
	// }

	//////////////////////////////////////

	function SetCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = 'expires='+d.toUTCString();
		document.cookie = cname + '=' + cvalue + '; ' + expires + '; path=/';
	}

	function GetCookie(cname) {
		var name = cname + '=';
		var ca = document.cookie.split(';');
		for(var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	}

	//////////////////////////////////////

	return {
		init: InitApp
	}
}