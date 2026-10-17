package com.finserv.modules.account.dto;

import jakarta.validation.constraints.Size;

public class UpdateAccountControlsRequest {

    @Size(max = 60, message = "Nickname cannot exceed 60 characters")
    private String nickname;

    private String statementPreference;

    public UpdateAccountControlsRequest() {
    }

    public UpdateAccountControlsRequest(String nickname, String statementPreference) {
        this.nickname = nickname;
        this.statementPreference = statementPreference;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getStatementPreference() {
        return statementPreference;
    }

    public void setStatementPreference(String statementPreference) {
        this.statementPreference = statementPreference;
    }
}
