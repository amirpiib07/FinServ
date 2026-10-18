package com.finserv.modules.dashboard.dto;

public class DashboardAlertDto {

    private String id;
    private String type; // INFO, WARNING, SUCCESS, ALERT
    private String title;
    private String message;
    private String actionUrl;
    private String actionLabel;

    public DashboardAlertDto() {
    }

    public DashboardAlertDto(String id, String type, String title, String message, String actionUrl, String actionLabel) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.actionUrl = actionUrl;
        this.actionLabel = actionLabel;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public String getActionLabel() {
        return actionLabel;
    }

    public void setActionLabel(String actionLabel) {
        this.actionLabel = actionLabel;
    }
}
